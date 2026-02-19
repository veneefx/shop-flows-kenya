import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lipana-signature",
};

/** Constant-time HMAC-SHA256 verification */
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, msgData);
    const computed = new TextDecoder().decode(encode(new Uint8Array(sigBuffer)));

    // Constant-time comparison
    if (computed.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-lipana-signature") || "";

    if (!signature) {
      console.warn("Missing X-Lipana-Signature header");
      return new Response(JSON.stringify({ error: "Unauthorized: missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the payload to get shop context
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = payload.event;
    const data = payload.data;
    const transactionId = data?.transactionId;
    const checkoutRequestId = data?.checkoutRequestID || data?.checkoutRequestId;

    // Look up the transaction to find the shop + webhook secret
    const { data: txn } = await supabase
      .from("transactions")
      .select("id, shop_id, order_id, status")
      .or(`lipana_transaction_id.eq.${transactionId},checkout_request_id.eq.${checkoutRequestId}`)
      .single();

    if (txn?.shop_id) {
      const { data: shop } = await supabase
        .from("shops")
        .select("lipana_webhook_secret")
        .eq("id", txn.shop_id)
        .single();

      if (shop?.lipana_webhook_secret) {
        const valid = await verifySignature(rawBody, signature, shop.lipana_webhook_secret);
        if (!valid) {
          console.error("Invalid webhook signature for shop", txn.shop_id);
          return new Response(JSON.stringify({ error: "Unauthorized: invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    console.log("Webhook event:", event, "transactionId:", transactionId);

    // Handle events
    switch (event) {
      case "payment.success":
      case "transaction.success": {
        // Update transaction status
        if (txn?.id) {
          await supabase.from("transactions").update({
            status: "success",
            lipana_transaction_id: transactionId || txn.id,
            raw_payload: payload,
            updated_at: new Date().toISOString(),
          }).eq("id", txn.id);

          // Update order status
          if (txn.order_id) {
            await supabase.from("orders").update({
              status: "paid",
              transaction_id: transactionId,
              updated_at: new Date().toISOString(),
            }).eq("id", txn.order_id);
          }
        } else {
          // Insert new transaction record if not found
          await supabase.from("transactions").insert({
            amount: data?.amount || 0,
            phone: data?.phone,
            lipana_transaction_id: transactionId,
            checkout_request_id: checkoutRequestId,
            status: "success",
            raw_payload: payload,
          });
        }
        break;
      }

      case "payment.failed":
      case "transaction.failed":
      case "transaction.cancelled": {
        if (txn?.id) {
          await supabase.from("transactions").update({
            status: "failed",
            raw_payload: payload,
            updated_at: new Date().toISOString(),
          }).eq("id", txn.id);

          if (txn.order_id) {
            await supabase.from("orders").update({
              status: "failed",
              updated_at: new Date().toISOString(),
            }).eq("id", txn.order_id);
          }
        }
        break;
      }

      case "payment.pending":
      case "transaction.pending": {
        if (txn?.id) {
          await supabase.from("transactions").update({
            status: "pending",
            raw_payload: payload,
          }).eq("id", txn.id);
        }
        break;
      }

      default:
        console.log("Unhandled webhook event:", event);
    }

    // Must respond quickly (within 5 seconds)
    return new Response(JSON.stringify({ received: true, event }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
