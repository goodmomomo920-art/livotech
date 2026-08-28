import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Official Kashier formula: HMAC-SHA256(Payment API Key, "/?payment=mid.orderId.amount.currency")
async function hmacSHA256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Authentication required" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const orderId: string = body.orderId;
    const origin: string = typeof body.origin === "string" && /^https?:\/\//i.test(body.origin)
      ? body.origin.replace(/\/$/, "")
      : new URL(req.url).origin;

    if (!orderId) return json({ error: "Order ID is required" }, 400);

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: order } = await adminClient.from("orders").select("*").eq("id", orderId).maybeSingle();

    if (!order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== userId) return json({ error: "You don't have permission to access this order" }, 403);
    if (order.payment_status === "paid") return json({ error: "This order has already been paid" }, 400);
    if (Number(order.total) <= 0) return json({ error: "Invalid order total" }, 400);

    const mid = Deno.env.get("KASHIER_MERCHANT_ID");
    const apiKey = Deno.env.get("KASHIER_API_KEY");
    const mode = Deno.env.get("KASHIER_MODE") || "test";
    if (!mid || !apiKey) return json({ error: "Payment gateway is not configured" }, 500);

    // order_number is already unique — reuse it directly as Kashier's merchantOrderId
    // instead of minting a second identifier.
    const merchantOrderId = order.order_number;
    const amountText = Number(order.total).toFixed(2);
    const currency = order.currency || "EGP";
    const path = `/?payment=${mid}.${merchantOrderId}.${amountText}.${currency}`;
    const hash = await hmacSHA256Hex(apiKey, path);

    const params = new URLSearchParams({
      merchantId: mid,
      orderId: merchantOrderId,
      amount: amountText,
      currency,
      hash,
      mode,
      merchantRedirect: `${origin}/kashier-callback?order=${merchantOrderId}`,
      customerReference: userId,
    });

    return json({ checkout_url: `https://payments.kashier.io/?${params.toString()}`, merchant_order_id: merchantOrderId });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Something went wrong" }, 500);
  }
});
