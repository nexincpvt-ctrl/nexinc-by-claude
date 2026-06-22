import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLAN_PRICES } from "@/lib/stripe/client";
import { getProfile } from "@/lib/supabase/queries";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { billingCycle } = body;

    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return NextResponse.json(
        { error: "Invalid billing cycle requested. Must be 'monthly' or 'yearly'." },
        { status: 400 }
      );
    }

    const priceId = PLAN_PRICES[billingCycle];
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe Price ID for ${billingCycle} is not configured on the server.` },
        { status: 500 }
      );
    }

    // Retrieve user's profile to reuse existing stripe_customer_id if available
    let stripeCustomerId = null;
    try {
      const profile = await getProfile(supabase, user.id);
      stripeCustomerId = profile.stripe_customer_id;
    } catch (err) {
      console.warn("Could not retrieve customer ID from profile, creating new customer details instead:", err.message);
    }

    // Determine request origin dynamically for redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";

    const sessionParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        supabase_user_id: user.id,
      },
    };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
