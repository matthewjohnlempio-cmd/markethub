
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const listingId =
      typeof body.listingId === "string" ? body.listingId.trim() : "";

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required." },
        { status: 400 }
      );
    }

    // Get the listing from Supabase.
    const { data: listing, error: listingError } = await supabaseAdmin
      .from("marketplace_listings")
      .select("id, title, description, price, email, status")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError) throw listingError;

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "This item has already been sold." },
        { status: 400 }
      );
    }

    const price = Number(listing.price);
    const unitAmount = Math.round(price * 100);

    if (!Number.isFinite(price) || unitAmount < 50) {
      return NextResponse.json(
        { error: "This listing has an invalid or too-low price." },
        { status: 400 }
      );
    }

    // Find the seller's connected Stripe account.
    const sellerEmail = listing.email.trim().toLowerCase();

    const { data: seller, error: sellerError } = await supabaseAdmin
      .from("marketplace_sellers")
      .select("stripe_account_id")
      .eq("email", sellerEmail)
      .maybeSingle();

    if (sellerError) throw sellerError;

    if (!seller) {
      return NextResponse.json(
        { error: "The seller has not connected Stripe yet." },
        { status: 400 }
      );
    }

    // Verify the seller's current Stripe account status.
    const account = await stripe.accounts.retrieve(
      seller.stripe_account_id
    );

    const ready =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    if (!ready) {
      return NextResponse.json(
        { error: "The seller has not completed Stripe onboarding." },
        { status: 400 }
      );
    }

    // Update the latest account status in Supabase.
    const { error: updateError } = await supabaseAdmin
      .from("marketplace_sellers")
      .update({
        details_submitted: account.details_submitted ?? false,
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("email", sellerEmail);

    if (updateError) throw updateError;

    // MarketHub keeps 10% of the purchase price.
    const platformFee = Math.round(unitAmount * 0.10);

    const origin = new URL(request.url).origin;

    const metadata = {
      listing_id: listing.id,
      seller_email: sellerEmail,
    };

    // Create a direct charge on the seller's connected account.
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "php",
              product_data: {
                name: listing.title,
                description: listing.description.slice(0, 500),
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: platformFee,
          metadata,
        },
        metadata,
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/listing/${listing.id}?canceled=true`,
      },
      {
        stripeAccount: seller.stripe_account_id,
      }
    );

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Checkout error:", error);

    return NextResponse.json(
      { error: "Unable to create the checkout session." },
      { status: 500 }
    );
  }
}
