import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// SECURITY NOTE: this function is reached via the customer's own browser
// (Kashier's merchantRedirect), so its query params CANNOT be trusted —
// anyone can craft a URL claiming success. It never writes anything; it only
// reports back whatever status the trusted server-to-server kashier-webhook
// has already written to the database. Real activation happens exclusively
// in supabase/functions/kashier-webhook.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Authentication required" }, 401);

    const body = await req.json();
    const orderNumber: string = body.orderNumber;
    if (!orderNumber) return json({ error: "Order number is required" }, 400);

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: order } = await service
      .from("orders")
      .select("id, order_number, status, payment_status, total, currency, user_id")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (!order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== userData.user.id) return json({ error: "You don't have permission to access this order" }, 403);

    return json({
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.payment_status,
      activated: order.payment_status === "paid",
      failed: order.payment_status === "failed",
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Something went wrong" }, 500);
  }
});
