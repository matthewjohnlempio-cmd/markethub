
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid seller email is required." },
        { status: 400 }
      );
    }

    const { data: seller, error: lookupError } = await supabaseAdmin
      .from("marketplace_sellers")
      .select("stripe_account_id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!seller) {
      return NextResponse.json(
        { error: "No Stripe account found for this seller." },
        { status: 404 }
      );
    }

    const account = await stripe.v2.core.accounts.retrieve(
      seller.stripe_account_id,
      {
        include: ["configuration.merchant", "requirements"],
      }
    );

    const cardPaymentsStatus =
      account.configuration?.merchant?.capabilities?.card_payments?.status;

    const isReady = cardPaymentsStatus === "active";

    const status = {
      details_submitted: isReady,
      charges_enabled: isReady,
      payouts_enabled: isReady,
    };

    const { error: updateError } = await supabaseAdmin
      .from("marketplace_sellers")
      .update({
        ...status,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (updateError) throw updateError;

    return NextResponse.json({
      connected: isReady,
      ...status,
      capability_status: cardPaymentsStatus ?? "unknown",
    });
  } catch (error) {
    console.error("Stripe account status error:", error);

    return NextResponse.json(
      { error: "Unable to check Stripe account status." },
      { status: 500 }
    );
  }
}
