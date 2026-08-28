import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CartItemInput {
  productId: string;
  addonId?: string;
  quantity: number;
  planId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const items: CartItemInput[] = body.items;
    const couponCode: string | undefined = body.couponCode;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Fetch all product IDs and addon IDs from cart
    const productIds = items.filter((i) => !i.addonId).map((i) => i.productId);
    const addonIds = items.filter((i) => i.addonId).map((i) => i.addonId!);

    // Fetch real product data from database (never trust frontend prices)
    const productMap = new Map<string, any>();
    if (productIds.length > 0) {
      const { data: products } = await adminClient
        .from("products")
        .select("id, name, price, currency, is_subscription, billing_interval, is_downloadable, product_types(name), status")
        .in("id", productIds);

      for (const p of products ?? []) {
        if (p.status !== "active") {
          return new Response(JSON.stringify({ error: `Product "${p.name}" is no longer available` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        productMap.set(p.id, p);
      }
    }

    // Fetch real addon data
    const addonMap = new Map<string, any>();
    if (addonIds.length > 0) {
      const { data: addons } = await adminClient
        .from("addons")
        .select("id, name, price, currency, billing_interval, is_active")
        .in("id", addonIds);

      for (const a of addons ?? []) {
        if (!a.is_active) {
          return new Response(JSON.stringify({ error: `Add-on "${a.name}" is no longer available` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        addonMap.set(a.id, a);
      }
    }

    // Validate compatibility: each addon must be compatible with a product in the cart
    if (addonIds.length > 0) {
      const { data: compat } = await adminClient
        .from("product_addons")
        .select("product_id, addon_id")
        .in("addon_id", addonIds)
        .in("product_id", productIds);

      const compatiblePairs = new Set((compat ?? []).map((c) => `${c.product_id}:${c.addon_id}`));

      for (const item of items) {
        if (item.addonId) {
          if (!productIds.includes(item.productId)) {
            return new Response(JSON.stringify({ error: "Add-on requires a compatible product in the cart" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (!compatiblePairs.has(`${item.productId}:${item.addonId}`)) {
            const addon = addonMap.get(item.addonId);
            return new Response(JSON.stringify({ error: `Add-on "${addon?.name}" is not compatible with the selected product` }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    // Calculate subtotal from database prices
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      if (item.addonId) {
        const addon = addonMap.get(item.addonId);
        if (!addon) {
          return new Response(JSON.stringify({ error: "Invalid add-on in cart" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const unitPrice = parseFloat(addon.price);
        const total = unitPrice * item.quantity;
        subtotal += total;
        orderItems.push({
          addon_id: item.addonId,
          product_id: item.productId,
          product_name_snapshot: addon.name,
          product_type_snapshot: "Add-on",
          quantity: item.quantity,
          unit_price: unitPrice,
          discount: 0,
          total,
        });
      } else {
        const product = productMap.get(item.productId);
        if (!product) {
          return new Response(JSON.stringify({ error: "Invalid product in cart" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const unitPrice = parseFloat(product.price);
        const total = unitPrice * item.quantity;
        subtotal += total;
        orderItems.push({
          product_id: item.productId,
          product_name_snapshot: product.name,
          product_type_snapshot: product.product_types?.name ?? null,
          quantity: item.quantity,
          unit_price: unitPrice,
          discount: 0,
          total,
        });
      }
    }

    // Validate coupon if provided
    let discount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const { data: coupon } = await adminClient
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!coupon) {
        return new Response(JSON.stringify({ error: "Invalid or expired coupon code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date();
      if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        return new Response(JSON.stringify({ error: "This coupon has expired" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return new Response(JSON.stringify({ error: "This coupon is not yet active" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (subtotal < parseFloat(coupon.minimum_order)) {
        return new Response(JSON.stringify({ error: `Coupon requires a minimum order of ${coupon.minimum_order} EGP` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
        return new Response(JSON.stringify({ error: "This coupon has reached its usage limit" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check per-customer usage
      const { count: customerUsage } = await adminClient
        .from("coupon_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("user_id", userId);

      if ((customerUsage ?? 0) >= coupon.per_customer_limit) {
        return new Response(JSON.stringify({ error: "You have already used this coupon the maximum number of times" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      couponId = coupon.id;

      if (coupon.discount_type === "percentage") {
        discount = (subtotal * parseFloat(coupon.value)) / 100;
        if (coupon.maximum_discount !== null) {
          discount = Math.min(discount, parseFloat(coupon.maximum_discount));
        }
      } else {
        discount = parseFloat(coupon.value);
        if (discount > subtotal) discount = subtotal;
      }
      discount = Math.round(discount * 100) / 100;
    }

    const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
    const currency = orderItems[0]?.unit_price ? "EGP" : "EGP";

    // Generate order number
    const orderNumber = `LT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create the order
    const { data: order, error: orderErr } = await adminClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: "pending",
        payment_status: "pending",
        currency,
        subtotal,
        discount,
        tax: 0,
        total,
        coupon_id: couponId,
      })
      .select()
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create order items
    const itemsToInsert = orderItems.map((oi) => ({ ...oi, order_id: order.id }));
    const { error: itemsErr } = await adminClient.from("order_items").insert(itemsToInsert);

    if (itemsErr) {
      // Clean up orphaned order
      await adminClient.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Failed to create order items" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create pending payment record
    const { error: payErr } = await adminClient.from("payments").insert({
      order_id: order.id,
      user_id: userId,
      provider: "demo",
      amount: total,
      currency,
      status: "pending",
    });

    if (payErr) {
      console.error("Payment record creation failed:", payErr);
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        subtotal,
        discount,
        total,
        currency,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
