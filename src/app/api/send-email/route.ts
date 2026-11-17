
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export async function POST(request: Request) {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      console.error("Gmail environment variables are missing.");

      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { listingId, buyerName, buyerEmail, message } = body;

    if (
      typeof listingId !== "string" ||
      typeof buyerName !== "string" ||
      typeof buyerEmail !== "string" ||
      typeof message !== "string" ||
      !listingId.trim() ||
      !buyerName.trim() ||
      !buyerEmail.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        { error: "Please provide all required information." },
        { status: 400 }
      );
    }

    if (
      buyerName.length > 100 ||
      buyerEmail.length > 254 ||
      message.length > 2000
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long." },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(buyerEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Get the seller's email from the actual database listing.
    const { data: listing, error: listingError } = await supabase
      .from("marketplace_listings")
      .select("id, title, email")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    const safeTitle = escapeHtml(listing.title);
    const safeBuyerName = escapeHtml(buyerName.trim());
    const safeBuyerEmail = escapeHtml(buyerEmail.trim());
    const safeMessage = escapeHtml(message.trim()).replace(/\n/g, "<br>");

    await transporter.sendMail({
      from: `"MarketHub" <${gmailUser}>`,
      to: listing.email,
      replyTo: buyerEmail.trim(),
      subject: `New message about your listing: ${listing.title}`,
      text: `
Hello!

Someone is interested in your MarketHub listing.

Listing: ${listing.title}

Buyer Name: ${buyerName}
Buyer Email: ${buyerEmail}

Message:
${message}

You can reply directly to this email to contact the buyer.

- MarketHub
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
          <h2 style="color: #2563eb;">You have a new message!</h2>

          <p>Someone is interested in your MarketHub listing.</p>

          <div style="background: #f3f4f6; padding: 16px; border-radius: 10px;">
            <strong>Listing:</strong> ${safeTitle}
          </div>

          <h3>Buyer Information</h3>
          <p><strong>Name:</strong> ${safeBuyerName}</p>
          <p><strong>Email:</strong> ${safeBuyerEmail}</p>

          <h3>Message</h3>
          <div style="background: #f9fafb; padding: 16px; border-radius: 10px; line-height: 1.6;">
            ${safeMessage}
          </div>

          <p style="margin-top: 24px;">
            You can reply directly to this email to contact the buyer.
          </p>

          <p style="color: #999; font-size: 12px;">MarketHub Notification</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Email notification sent successfully.",
    });
  } catch (error) {
    console.error("Email sending error:", error);

    return NextResponse.json(
      { error: "Unable to send email notification." },
      { status: 500 }
    );
  }
}
