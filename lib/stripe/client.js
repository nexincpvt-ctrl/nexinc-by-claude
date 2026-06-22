import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY environment variable is missing. Using placeholder key.");
}

// Initialize Stripe server-side instance
export const stripe = new Stripe(stripeKey, {
  apiVersion: "2023-10-16", // use standard stable API version
});

// Map pricing cycles to Stripe Price IDs configured in .env.local
export const PLAN_PRICES = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY || "price_placeholder_monthly",
  yearly: process.env.STRIPE_PRICE_ID_YEARLY || "price_placeholder_yearly",
};
