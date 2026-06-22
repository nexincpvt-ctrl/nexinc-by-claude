import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";



export async function POST(req) {
  let body;
  try {
    body = await req.text();
  } catch (err) {
    console.error("Webhook read body error:", err);
    return NextResponse.json({ error: "Unable to read request body." }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`Received Stripe Webhook event: ${event.type}`);

  // Initialize secure Supabase admin client (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase environment configuration missing inside Webhook.");
    return NextResponse.json({ error: "Server Database configuration error." }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Checkout Session Completed (Initial purchase)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!userId) {
        console.error("No supabase_user_id found in Checkout session metadata.");
        return NextResponse.json({ error: "Missing user metadata." }, { status: 400 });
      }

      // Fetch details of the subscription to retrieve the billing period details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const interval = subscription.items.data[0]?.plan.interval;
      const billingCycle = interval === "year" ? "yearly" : "monthly";
      const planRenewsAt = new Date(subscription.current_period_end * 1000).toISOString();

      const { error: dbError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "ultimate",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          billing_cycle: billingCycle,
          plan_renews_at: planRenewsAt,
        })
        .eq("id", userId);

      if (dbError) {
        console.error("Error upgrading user profile in DB:", dbError.message);
        throw dbError;
      }

      console.log(`Successfully upgraded User ID ${userId} to Ultimate plan (Customer ID: ${customerId})`);
    }

    // 2. Subscription Updated (Renews, upgrades, or status changes)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer;
      const interval = subscription.items.data[0]?.plan.interval;
      const billingCycle = interval === "year" ? "yearly" : "monthly";
      const planRenewsAt = new Date(subscription.current_period_end * 1000).toISOString();
      const status = subscription.status;

      // Map Stripe statuses to NexInc tiers
      const plan = (status === "active" || status === "trialing") ? "ultimate" : "free";

      const { error: dbError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: plan,
          stripe_customer_id: customerId,
          billing_cycle: plan === "ultimate" ? billingCycle : null,
          plan_renews_at: plan === "ultimate" ? planRenewsAt : null,
        })
        .eq("stripe_subscription_id", subscriptionId);

      if (dbError) {
        console.error("Error updating user subscription details in DB:", dbError.message);
        throw dbError;
      }

      console.log(`Successfully updated subscription ${subscriptionId} status to ${status} (Plan: ${plan})`);
    }

    // 3. Subscription Deleted (Cancelled or lapsed payments)
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;

      const { error: dbError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "free",
          billing_cycle: null,
          plan_renews_at: null,
        })
        .eq("stripe_subscription_id", subscriptionId);

      if (dbError) {
        console.error("Error downgrading user profile upon cancellation:", dbError.message);
        throw dbError;
      }

      console.log(`Successfully downgraded user subscription ${subscriptionId} back to Free plan`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Error processing webhook database update:", err.message);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
