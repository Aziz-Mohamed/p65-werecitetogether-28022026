import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_ROLES = ['student', 'teacher', 'parent', 'supervisor', 'program_admin', 'master_admin'];

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(error: string, code: string, status = 400) {
  return jsonResponse({ error, code }, status);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing authorization header", "UNAUTHORIZED", 401);
    }

    const token = authHeader.replace("Bearer ", "");

    // Create service-role admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Verify JWT by getting user from the auth service
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !caller) {
      return errorResponse(
        `Token verification failed: ${callerError?.message ?? 'No user returned'}`,
        "UNAUTHORIZED",
        401
      );
    }

    // Get caller's profile to check role
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, school_id")
      .eq("id", caller.id)
      .single();

    if (profileError || !callerProfile) {
      return errorResponse(
        `Profile lookup failed: ${profileError?.message ?? 'No profile found'}`,
        "UNAUTHORIZED",
        401
      );
    }

    // Parse request body
    const body = await req.json();
    const { action } = body;

    // ─── Action: update-role ──────────────────────────────────────────────────
    if (action === 'update-role') {
      const { userId, role } = body;

      // Validate caller has master_admin role
      if (callerProfile.role !== 'master_admin') {
        return errorResponse("Only master admins can change roles", "UNAUTHORIZED", 403);
      }

      // Validate target role
      if (!role || !VALID_ROLES.includes(role)) {
        return errorResponse(
          `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
          "INVALID_ROLE"
        );
      }

      // Validate target user ID
      if (!userId || typeof userId !== 'string') {
        return errorResponse("Target userId is required", "INVALID_INPUT");
      }

      // Prevent self-role-change
      if (userId === caller.id) {
        return errorResponse("Cannot change your own role", "SELF_ROLE_CHANGE", 403);
      }

      // Verify target user exists
      const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", userId)
        .single();

      if (targetError || !targetProfile) {
        return errorResponse("Target user not found", "USER_NOT_FOUND", 404);
      }

      // Update the role using service_role client (bypasses prevent_role_self_update trigger)
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (updateError) {
        return errorResponse(
          `Failed to update role: ${updateError.message}`,
          "UPDATE_FAILED",
          500
        );
      }

      return jsonResponse({
        profile: {
          id: userId,
          role,
          full_name: targetProfile.full_name,
        },
      });
    }

    // ─── Unknown action ───────────────────────────────────────────────────────
    return errorResponse(
      `Unknown action: ${action ?? 'none'}. Supported actions: update-role`,
      "INVALID_ACTION"
    );
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Internal server error",
      "INTERNAL_ERROR",
      500
    );
  }
});
