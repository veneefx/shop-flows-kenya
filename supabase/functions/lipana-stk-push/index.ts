import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { phone, amount, orderId, shopId } = body;

    if (!phone || !amount || !shopId) {
      return new Response(JSON.stringify({ error: "phone, amount, and shopId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount < 10) {
      return new Response(JSON.stringify({ error: "Minimum transaction amount is KSh 10" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the shop's Lipana secret key
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("lipana_secret_key, user_id")
      .eq("id", shopId)
      .eq("user_id", user.id)
      .single();

    if (shopError || !shop) {
      return new Response(JSON.stringify({ error: "Shop not found or unauthorized" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shop.lipana_secret_key) {
      return new Response(JSON.stringify({ error: "Lipana secret key not configured. Go to Dashboard → Payments to add your key." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone number
    let normalizedPhone = phone.toString().replace(/\s+/g, "");
    if (normalizedPhone.startsWith("0")) normalizedPhone = "+254" + normalizedPhone.slice(1);
    if (!normalizedPhone.startsWith("+")) normalizedPhone = "+" + normalizedPhone;

    // Call Lipana STK Push API
    const lipanaResponse = await fetch("https://api.lipana.dev/v1/transactions/push-stk", {
      method: "POST",
      headers: {
        "x-api-key": shop.lipana_secret_key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: normalizedPhone, amount }),
    });

    const lipanaData = await lipanaResponse.json();

    if (!lipanaResponse.ok) {
      console.error("Lipana API error:", lipanaData);
      return new Response(JSON.stringify({ error: lipanaData.message || "Payment initiation failed" }), {
        status: lipanaResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save transaction to DB
    const transactionId = lipanaData?.data?.transactionId;
    const checkoutRequestId = lipanaData?.data?.checkoutRequestID;

    const { data: txn } = await supabase.from("transactions").insert({
      shop_id: shopId,
      order_id: orderId || null,
      amount,
      phone: normalizedPhone,
      lipana_transaction_id: transactionId,
      checkout_request_id: checkoutRequestId,
      status: "pending",
    }).select().single();

    return new Response(JSON.stringify({
      success: true,
      message: lipanaData?.data?.message || "STK push sent to your phone. Please complete the payment.",
      transactionId,
      checkoutRequestId,
      dbTransactionId: txn?.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("STK push error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
