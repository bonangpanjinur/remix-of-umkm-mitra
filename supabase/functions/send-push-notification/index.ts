import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushRequest {
  user_id?: string;
  user_ids?: string[];
  role?: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.log("VAPID keys not configured, skipping push notification");
      return new Response(
        JSON.stringify({ success: false, message: "VAPID keys not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushRequest = await req.json();
    const { user_id, user_ids, role, title, body, icon, url, data } = payload;

    // Validate required fields
    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Build query to get subscriptions
    let subscriptionQuery = supabase.from("push_subscriptions").select("*");

    if (user_id) {
      subscriptionQuery = subscriptionQuery.eq("user_id", user_id);
    } else if (user_ids && user_ids.length > 0) {
      subscriptionQuery = subscriptionQuery.in("user_id", user_ids);
    } else if (role) {
      // Get users with specific role first
      const { data: roleUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", role);

      if (!roleUsers || roleUsers.length === 0) {
        return new Response(
          JSON.stringify({ success: true, sent: 0, message: "No users with this role" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userIds = roleUsers.map((u) => u.user_id);
      subscriptionQuery = subscriptionQuery.in("user_id", userIds);
    } else {
      return new Response(
        JSON.stringify({ error: "user_id, user_ids, or role is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: subscriptions, error: subError } = await subscriptionQuery;

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    webpush.setVapidDetails(
      "mailto:admin@desamart.app",
      vapidPublicKey,
      vapidPrivateKey
    );

    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: icon || "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: url || "/",
      data,
    });

    let sentCount = 0;
    const failedSubscriptions: string[] = [];

    // Send to all subscriptions
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
        sentCount++;
      } catch (error: unknown) {
        console.error(`Failed to send to ${sub.endpoint}:`, error);
        
        // If subscription is invalid (410 Gone or 404), mark for deletion
        const err = error as { statusCode?: number };
        if (err.statusCode === 410 || err.statusCode === 404) {
          failedSubscriptions.push(sub.id);
        }
      }
    }

    // Clean up invalid subscriptions
    if (failedSubscriptions.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", failedSubscriptions);
    }

    console.log(`Push notifications sent: ${sentCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: subscriptions.length,
        cleaned: failedSubscriptions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending push notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
