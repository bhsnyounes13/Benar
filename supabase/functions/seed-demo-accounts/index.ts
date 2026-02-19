import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const accounts = [
    { email: "client@demo.com", password: "demo1234", full_name: "Demo Client", role: "client" },
    { email: "designer@demo.com", password: "demo1234", full_name: "Demo Designer", role: "designer" },
    { email: "buyer@demo.com", password: "demo1234", full_name: "Demo Buyer", role: "media_buyer" },
  ];

  const results = [];

  for (const acc of accounts) {
    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === acc.email);

    if (existing) {
      results.push({ email: acc.email, status: "already_exists" });
      continue;
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: { full_name: acc.full_name, role: acc.role },
    });

    if (error) {
      results.push({ email: acc.email, status: "error", message: error.message });
      continue;
    }

    // Assign role
    if (data.user) {
      await supabaseAdmin.from("user_roles").insert({ user_id: data.user.id, role: acc.role });
    }

    results.push({ email: acc.email, status: "created" });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
