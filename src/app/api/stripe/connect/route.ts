
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Check whether this seller already has a connected account.
    const { data: existingSeller, error: lookupError } =
      await supabaseAdmin
        .from("marketplace_sellers")
        .select("stripe_account_id")
        .eq("email", email)
        .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    let accountId = existingSeller?.stripe_account_id;

    // Create a connected account using Stripe Accounts v2.
    if (!accountId) {
      const account = await stripe.v2.core.accounts.create({
        contact_email: email,
        display_name: email,
        dashboard: "full",
        identity: {
          country: "us",
          entity_type: "individual",
        },
        configuration: {
          merchant: {
            capabilities: {
              card_payments: { requested: true },
            },
          },
        },
        defaults: {
          responsibilities: {
            fees_collector: "stripe",
            losses_collector: "stripe",
          },
        },
        metadata: {
          seller_email: email,
        },
      });

      accountId = account.id;

      const { error: insertError } = await supabaseAdmin
        .from("marketplace_sellers")
        .insert({
          email,
          stripe_account_id: accountId,
        });

      if (insertError) {
        throw insertError;
      }
    }

    const origin = new URL(request.url).origin;

    const returnUrl = new URL("/connect/return", origin);
    returnUrl.searchParams.set("email", email);

    const refreshUrl = new URL("/connect/refresh", origin);
    refreshUrl.searchParams.set("email", email);

    // Generate a Stripe-hosted onboarding link using Accounts v2.
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
            refresh_url: refreshUrl.toString(),
            return_url: returnUrl.toString(),
        },
      },
    });

    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error("Stripe onboarding error:", error);

    return NextResponse.json(
      { error: "Unable to start Stripe onboarding." },
      { status: 500 }
    );
  }
}
