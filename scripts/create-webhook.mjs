
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(secretKey);

const endpoint = await stripe.webhookEndpoints.create({
  url: "https://markethub-smoky.vercel.app/api/stripe/webhook",
  connect: true,
  enabled_events: [
    "checkout.session.completed",
    "account.updated",
  ],
});

console.log("Webhook endpoint created:", endpoint.id);
console.log("Signing secret:", endpoint.secret);
