import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { activatePaidOrder } from "../_shared/activate-order.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function hmacSHA256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// This is the ONLY function allowed to activate a paid order. It is called
// server-to-server directly by Kashier (never by the customer's browser), so
// it cannot be spoofed by someone typing a URL. Register this URL in the
// Kashier Dashboard -> Webhooks:
//   https://<project-ref>.supabase.co/functions/v1/kashier-webhook
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const rawBody = await req.text();
    const apiKey = Deno.env.get("KASHIER_API_KEY") || "";
    const signatureHeader = req.headers.get("x-kashier-signature") || req.headers.get("X-Kashier-Signature") || "";

    const event = JSON.parse(rawBody);
    const data = event?.data ?? event;

    // Kashier tells us exactly which fields were used to build the signature via
    // data.signatureKeys: sort those keys alphabetically, build a URL-encoded
    // query string from their values, then HMAC-SHA256 it with the Payment API Key.
    const signatureKeys: string[] = Array.isArray(data?.signatureKeys) ? [...data.signatureKeys].sort() : [];
    let signatureValid = false;
    if (signatureKeys.length > 0 && apiKey) {
      const queryString = signatureKeys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(data?.[k]))}`).join("&");
      const expected = await hmacSHA256Hex(apiKey, queryString);
      signatureValid = !!signatureHeader && signatureHeader === expected;
    }
    if (!signatureValid) {
      console.log("kashier-webhook: signature mismatch — rejecting");
      return json({ error: "invalid signature" }, 403);
    }

    const merchantOrderId: string | undefined = data?.merchantOrderId || data?.orderReference;
    const status: string = String(data?.status || data?.paymentStatus || "").toUpperCase();
    const transactionId: string | undefined = data?.transactionId;

    if (!merchantOrderId) return json({ received: true, warning: "no merchantOrderId" });

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    // merchantOrderId is the order_number we generated in create-order.
    const { data: order } = await service.from("orders").select("id,user_id,payment_status").eq("order_number", merchantOrderId).maybeSingle();
    if (!order) return json({ received: true, warning: "unknown order" });

    if (status !== "SUCCESS") {
      await service.from("payments").update({ status: "failed", provider_payment_id: transactionId ?? null }).eq("order_id", order.id).eq("status", "pending");
      return json({ received: true, activated: false });
    }

    const result = await activatePaidOrder(service, order.id, order.user_id, transactionId ?? null);
    return json({ received: true, activated: result.ok && !("already" in result && result.already) });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
