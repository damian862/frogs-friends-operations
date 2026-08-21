import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const APP_URL = "https://frogs-friends-operations.vercel.app/?invite=1";
const allowedRoles = new Set([
  "operations_admin","site_manager","finance","staff","school_viewer",
  "pool_manager","lettings_manager","bursar","operational_viewer"
]);

Deno.serve(async (req: Request) => {
  const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status,headers:{...cors,"Content-Type":"application/json"}});
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) return json({error:"Not signed in"}, 401);

    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: caller } = await admin.from("profiles").select("role,organisation_id").eq("id", user.id).single();
    if (!caller || !["owner_admin","operations_admin"].includes(caller.role)) return json({error:"Only owner/admin users can invite staff"}, 403);

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.full_name || "").trim();
    const role = String(body.role || "operational_viewer");
    const siteIds = Array.isArray(body.site_ids) ? [...new Set(body.site_ids.map(String))] : [];
    const homeSiteId = body.home_site_id ? String(body.home_site_id) : (siteIds[0] || null);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address");
    if (!fullName) throw new Error("Enter the user's name");
    if (!allowedRoles.has(role)) throw new Error("Invalid role");
    if (role !== "operations_admin" && siteIds.length === 0) throw new Error("Assign at least one school");

    if (siteIds.length) {
      const { data: validSites } = await admin.from("sites").select("id").eq("organisation_id", caller.organisation_id).in("id", siteIds);
      if ((validSites || []).length !== siteIds.length) throw new Error("One or more schools are not valid for this organisation");
    }

    const { data: invite, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }, redirectTo: APP_URL
    });
    if (inviteErr) throw inviteErr;
    const uid = invite.user?.id;
    if (!uid) throw new Error("Invitation was created but no user ID was returned");

    const { error: profileErr } = await admin.from("profiles").update({full_name:fullName,email,role,home_site_id:homeSiteId,active:true,updated_at:new Date().toISOString()}).eq("id",uid);
    if (profileErr) throw profileErr;
    const { error: deleteErr } = await admin.from("site_memberships").delete().eq("user_id",uid);
    if (deleteErr) throw deleteErr;
    const permissions: Record<string,{can_view_finance:boolean,can_edit_bookings:boolean,can_manage_events:boolean}> = {
      pool_manager:{can_view_finance:false,can_edit_bookings:true,can_manage_events:true},lettings_manager:{can_view_finance:true,can_edit_bookings:true,can_manage_events:true},finance:{can_view_finance:true,can_edit_bookings:false,can_manage_events:false},bursar:{can_view_finance:true,can_edit_bookings:false,can_manage_events:false},operational_viewer:{can_view_finance:false,can_edit_bookings:false,can_manage_events:false},school_viewer:{can_view_finance:false,can_edit_bookings:false,can_manage_events:false},site_manager:{can_view_finance:true,can_edit_bookings:true,can_manage_events:true},staff:{can_view_finance:false,can_edit_bookings:false,can_manage_events:false},operations_admin:{can_view_finance:true,can_edit_bookings:true,can_manage_events:true}
    };
    if (siteIds.length) {
      const p = permissions[role] || permissions.staff;
      const { error: membershipErr } = await admin.from("site_memberships").insert(siteIds.map(site_id => ({user_id:uid,site_id,role,...p})));
      if (membershipErr) throw membershipErr;
    }
    return json({ok:true,user_id:uid,email});
  } catch (err) {
    return json({error:err instanceof Error ? err.message : String(err)}, 400);
  }
});
