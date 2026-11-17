
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  ShoppingBag,
  Mail,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  email: string;
  category: string;
  image_url: string;
  created_at: string;
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchListing() {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setError("Listing not found or unavailable.");
      } else {
        setListing(data as Listing);
      }

      setLoading(false);
    }

    if (id) fetchListing();
  }, [id]);

  async function handleMessageSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!listing) return;

    if (
      !buyerName.trim() ||
      !buyerEmail.trim() ||
      !message.trim()
    ) {
      setError("Please complete all message fields.");
      return;
    }

    if (
      buyerName.trim().length > 100 ||
      buyerEmail.trim().length > 254 ||
      message.trim().length > 2000
    ) {
      setError("Please keep your information within the allowed length.");
      return;
    }

    setSending(true);

    // Save the buyer's message to Supabase first.
    const { error: messageError } = await supabase
      .from("marketplace_messages")
      .insert({
        listing_id: listing.id,
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim().toLowerCase(),
        message: message.trim(),
      });

    if (messageError) {
      console.error("Message saving error:", messageError);
      setError("Unable to send your message. Please try again.");
      setSending(false);
      return;
    }

    // Send an email notification to the seller.
    try {
      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing.id,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim().toLowerCase(),
          message: message.trim(),
        }),
      });

      if (!emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.error("Email notification error:", emailResult);

        setSuccess(
          "Your message was saved, but the email notification could not be sent."
        );
      } else {
        setSuccess(
          "Your message was sent successfully! The seller has been notified by email."
        );
      }
    } catch (emailError) {
      console.error("Email request failed:", emailError);

      setSuccess(
        "Your message was saved, but the email notification could not be sent."
      );
    }

    setBuyerName("");
    setBuyerEmail("");
    setMessage("");
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f6f8] px-5">
        <ShoppingBag size={48} className="mb-4 text-gray-300" />
        <h1 className="text-xl font-bold">{error}</h1>
        <Link href="/" className="mt-5 text-sm font-semibold text-blue-600">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShoppingBag size={21} />
            </div>
            <span className="text-xl font-bold">
              Market<span className="text-blue-600">Hub</span>
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            Marketplace / {listing.category} / {listing.title}
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Product information */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <img
                src={listing.image_url}
                alt={listing.title}
                className="max-h-[550px] w-full object-contain bg-gray-50"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  {listing.category}
                </span>
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                {listing.title}
              </h1>

              <p className="mt-3 text-3xl font-bold text-blue-600">
                ₱{Number(listing.price).toLocaleString("en-PH")}
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={16} />
                Marketplace listing
                <span>·</span>
                {new Date(listing.created_at).toLocaleDateString()}
              </div>

              <div className="my-7 border-t border-gray-100" />

              <h2 className="text-lg font-bold">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                {listing.description}
              </p>

              <div className="my-7 border-t border-gray-100" />

              <h2 className="mb-3 text-lg font-bold">Seller Information</h2>

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Mail size={21} />
                </div>

                <div>
                  <p className="text-sm font-semibold">Seller</p>
                  <p className="text-sm text-gray-500">
                    {listing.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message seller */}
          <div>
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Message Seller</h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Interested in this item? Send the seller a message to ask
                questions or discuss the purchase.
              </p>

              <form onSubmit={handleMessageSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Your Name
                  </label>
                  <input
                    required
                    maxLength={100}
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Your Email
                  </label>
                  <input
                    required
                    type="email"
                    maxLength={254}
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Message
                  </label>
                  <textarea
                    required
                    maxLength={2000}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi! Is this item still available?"
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                    <CheckCircle size={18} className="shrink-0" />
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Your message will be saved in our marketplace database and an email notification will be sent to the seller.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white py-7 text-center text-sm text-gray-400">
        © 2026 MarketHub. Your community marketplace.
      </footer>
    </div>
  );
}
