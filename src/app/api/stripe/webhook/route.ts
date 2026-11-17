
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
  ].filter((secret): secret is string => Boolean(secret));

  if (!signature || webhookSecrets.length === 0) {
    return NextResponse.json(
      { error: "Missing Stripe webhook configuration." },
      { status: 400 }
    );
  }

  const body = await request.text();

  let event: Stripe.Event | undefined;

  // Try both webhook signing secrets.
  for (const secret of webhookSecrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
      break;
    } catch {
      // Try the next signing secret.
    }
  }

  if (!event) {
    console.error("Stripe webhook signature verification failed.");

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  try {
    // Update seller status when Stripe reports an account change.
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;

      const { error } = await supabaseAdmin
        .from("marketplace_sellers")
        .update({
          details_submitted: account.details_submitted ?? false,
          charges_enabled: account.charges_enabled ?? false,
          payouts_enabled: account.payouts_enabled ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_account_id", account.id);

      if (error) throw error;
    }

    // Record successful payments from connected seller accounts.
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      const listingId = session.metadata?.listing_id;
      const sellerEmail = session.metadata?.seller_email;
      const connectedAccountId = event.account;

      // Ignore events that do not belong to a MarketHub listing.
      if (!listingId || !sellerEmail || !connectedAccountId) {
        return NextResponse.json({ received: true });
      }

      if (!session.amount_total || session.amount_total <= 0) {
        return NextResponse.json({ received: true });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      const platformFee = Math.round(session.amount_total * 0.10);

      // Save the completed order.
      const { error: orderError } = await supabaseAdmin
        .from("marketplace_orders")
        .upsert(
          {
            listing_id: listingId,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
            seller_email: sellerEmail,
            buyer_email:
              session.customer_details?.email ??
              session.customer_email ??
              null,
            amount_total: session.amount_total,
            platform_fee: platformFee,
            status: "paid",
          },
          {
            onConflict: "stripe_checkout_session_id",
          }
        );

      if (orderError) throw orderError;

      // Mark the listing as sold.
      const { error: listingError } = await supabaseAdmin
        .from("marketplace_listings")
        .update({ status: "sold" })
        .eq("id", listingId);

      if (listingError) throw listingError;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
