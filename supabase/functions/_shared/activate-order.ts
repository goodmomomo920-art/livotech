// Shared activation logic. Only ever called after a payment has been
// confirmed by a trusted source (the Kashier server-to-server webhook).
// Never call this from a function that trusts the customer's browser.
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

type AdminClient = ReturnType<typeof createClient>;

export async function activatePaidOrder(adminClient: AdminClient, orderId: string, userId: string, transactionRef: string | null) {
  const { data: order } = await adminClient.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return { ok: false, reason: "order_not_found" as const };
  if (order.payment_status === "paid") return { ok: true, already: true as const };

  const { data: orderItems } = await adminClient.from("order_items").select("*").eq("order_id", orderId);
  if (!orderItems || orderItems.length === 0) return { ok: false, reason: "no_items" as const };

  await adminClient.from("payments").update({
    status: "paid",
    provider_payment_id: transactionRef,
    transaction_reference: transactionRef,
    paid_at: new Date().toISOString(),
  }).eq("order_id", orderId).eq("status", "pending");

  await adminClient.from("orders").update({
    status: "completed",
    payment_status: "paid",
    payment_method: "kashier",
  }).eq("id", orderId);

  if (order.coupon_id) {
    await adminClient.rpc("increment_coupon_usage", { coupon_id: order.coupon_id }).catch(() => {});
    await adminClient.from("coupon_redemptions").insert({
      coupon_id: order.coupon_id,
      order_id: orderId,
      user_id: userId,
      discount_amount: order.discount,
    }).catch(() => {});
  }

  for (const item of orderItems) {
    if (item.addon_id) {
      const addonRow = await adminClient.from("addons").select("billing_interval").eq("id", item.addon_id).maybeSingle();
      const billingInterval = addonRow.data?.billing_interval;
      const renewalDate = billingInterval
        ? new Date(Date.now() + (billingInterval === "yearly" ? 365 : billingInterval === "quarterly" ? 90 : 30) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await adminClient.from("customer_addons").insert({
        user_id: userId,
        addon_id: item.addon_id,
        product_id: item.product_id,
        order_id: orderId,
        status: "active",
        start_date: new Date().toISOString(),
        renewal_date: renewalDate,
      });
    } else if (item.product_id) {
      const { data: product } = await adminClient
        .from("products")
        .select("is_subscription, billing_interval")
        .eq("id", item.product_id)
        .maybeSingle();

      if (product?.is_subscription) {
        const nextBilling = product.billing_interval
          ? new Date(Date.now() + (product.billing_interval === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
          : null;

        const { data: sub } = await adminClient.from("subscriptions").insert({
          user_id: userId,
          product_id: item.product_id,
          order_id: orderId,
          plan: "standard",
          status: "active",
          price: item.unit_price,
          currency: order.currency,
          billing_interval: product.billing_interval,
          start_date: new Date().toISOString(),
          next_billing_date: nextBilling,
          provider: "kashier",
        }).select().single();

        await adminClient.from("customer_products").insert({
          user_id: userId,
          product_id: item.product_id,
          order_id: orderId,
          status: "active",
          plan: "standard",
          purchase_date: new Date().toISOString(),
          activation_date: new Date().toISOString(),
          subscription_id: sub?.id ?? null,
        });
      } else {
        await adminClient.from("customer_products").insert({
          user_id: userId,
          product_id: item.product_id,
          order_id: orderId,
          status: "active",
          plan: "one_time",
          purchase_date: new Date().toISOString(),
          activation_date: new Date().toISOString(),
        });
      }
    }
  }

  await adminClient.from("notifications").insert({
    user_id: userId,
    type: "purchase",
    title: "Order completed",
    message: `Your order ${order.order_number} has been completed successfully.`,
    link: "/dashboard/orders",
  });

  return { ok: true, already: false as const };
}
