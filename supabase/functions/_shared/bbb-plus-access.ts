import { createClient } from "npm:@supabase/supabase-js@2.117.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function adminClient() {
  const url = requireEnv("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SECRET_KEY") || requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticatedUser(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(authorization.slice(7));
  if (error || !data.user) return null;
  return data.user;
}

export async function entitlementFor(user: { id: string; email?: string | null }) {
  const admin = adminClient();
  const email = String(user.email || "").trim().toLowerCase();

  if (email) {
    const { data: adminRow, error: adminError } = await admin
      .from("bbb_admin_users")
      .select("role,active")
      .eq("email", email)
      .maybeSingle();
    if (adminError) throw adminError;
    if (adminRow?.active) {
      return {
        has_access: true,
        source: "admin",
        role: adminRow.role || "admin",
        membership: null,
      };
    }
  }

  const { data: membership, error: memberError } = await admin
    .from("bbb_plus_memberships")
    .select("status,plan_interval,founding_member,cancel_at_period_end,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (memberError) throw memberError;

  const status = String(membership?.status || "").toLowerCase();
  const hasAccess = status === "active" || status === "trialing";
  return {
    has_access: hasAccess,
    source: hasAccess ? "membership" : "none",
    role: hasAccess ? "member" : null,
    membership: membership || null,
  };
}
