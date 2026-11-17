
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (
      !sessionId ||
      !sessionId.startsWith("cs_test_")
    ) {
      return NextResponse.json(
        { error: "Invalid checkout session." },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("marketplace_orders")
      .select("id, listing_id, amount_total, status")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (error) throw error;

    if (!order) {
      return NextResponse.json({
        confirmed: false,
        message: "Waiting for payment confirmation.",
      });
    }

    return NextResponse.json({
      confirmed: order.status === "paid",
      order,
    });
  } catch (error) {
    console.error("Order status error:", error);

    return NextResponse.json(
      { error: "Unable to check order status." },
      { status: 500 }
    );
  }
}
