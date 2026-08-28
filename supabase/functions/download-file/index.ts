import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const url = new URL(req.url);
    const fileId = url.searchParams.get("fileId");

    if (!fileId) {
      return new Response(JSON.stringify({ error: "File ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // 1. Fetch the file record — verify it exists and is active
    const { data: file, error: fileErr } = await adminClient
      .from("product_files")
      .select("*")
      .eq("id", fileId)
      .eq("is_active", true)
      .maybeSingle();

    if (fileErr || !file) {
      return new Response(JSON.stringify({ error: "File not found or unavailable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verify the user owns the product this file belongs to
    const { data: ownership } = await adminClient
      .from("customer_products")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", file.product_id)
      .eq("status", "active")
      .maybeSingle();

    if (!ownership) {
      return new Response(JSON.stringify({ error: "You don't have access to this file" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate a short-lived signed URL (10 minutes)
    const { data: signedUrlData, error: signedErr } = await adminClient
      .storage
      .from("product-files")
      .createSignedUrl(file.storage_path, 600);

    if (signedErr || !signedUrlData?.signedUrl) {
      return new Response(JSON.stringify({ error: "Failed to generate download link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Record the download
    await adminClient.from("downloads").insert({
      user_id: userId,
      product_id: file.product_id,
      product_file_id: file.id,
      file_name: file.file_name,
    });

    return new Response(
      JSON.stringify({ url: signedUrlData.signedUrl, fileName: file.file_name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
