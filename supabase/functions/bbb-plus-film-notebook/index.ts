import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {adminClient, authenticatedUser, corsHeaders, entitlementFor, json} from "../_shared/bbb-plus-access.ts";

/** Read-only, server-gated access to Bobby's original Film Notebook.
 * Never embed protected editorial text in public HTML, views or JS bundles. */
Deno.serve(async (req: Request) => {
 if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
 if (req.method !== "GET") return json({error:"Method not allowed"},405);
 try {
  const user=await authenticatedUser(req);
  if (!user) return json({error:"Sign in to read BBB+ Film Notebook.",code:"sign_in_required"},401);

  // Existing BBB+ entitlement is always checked on the server, never the client.
  const access=await entitlementFor(user);
  if(!access.has_access) return json({error:"BBB+ membership required.",code:"bbb_plus_required"},403);
  // An active record with an elapsed billing period must not grant stale access.
  const expiry=access.membership?.current_period_end;
  if(access.source==="membership"&&expiry&&Date.parse(String(expiry))<Date.now())
   return json({error:"Membership period has ended.",code:"bbb_plus_required"},403);

  const key=new URL(req.url).searchParams.get("player_key")?.trim()||"";
  if(!/^[a-z0-9][a-z0-9-]{1,140}$/.test(key))
   return json({error:"A valid player key is required."},400);

  const admin=adminClient();
  const {data,error}=await admin.from("prospect_grades")
   .select("player_key,position,class_year,overall_grade,pro_comp,scouting_published,scouting_strengths,scouting_concerns,nfl_projection,development_plan,comp_explanation,updated_at")
   .eq("player_key",key).maybeSingle();
  if(error)throw error;
  if(!data||!data.scouting_published||Number(data.class_year)<2027)
   return json({error:"No published Film Notebook for that prospect.",code:"not_found"},404);
  const notebook={
   strengths:data.scouting_strengths||"",
   concerns:data.scouting_concerns||"",
   projection:data.nfl_projection||"",
   development_plan:data.development_plan||"",
   comp_explanation:data.comp_explanation||""
  };
  if(!Object.values(notebook).some(v=>String(v).trim()))
   return json({error:"Film Notebook is not ready.",code:"not_found"},404);
  return json({
   access:{has_access:true,source:access.source},
   player:{player_key:data.player_key,position:data.position,class_year:data.class_year,
     grade:data.overall_grade,comp:data.pro_comp},
   notebook,updated_at:data.updated_at
  });
 }catch(error){
  console.error("BBB+ Film Notebook access failed",error);
  return json({error:"Film Notebook is temporarily unavailable.",code:"unavailable"},500);
 }
});
