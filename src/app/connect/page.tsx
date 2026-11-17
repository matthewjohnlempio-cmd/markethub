
"use client";

import { useState } from "react";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ConnectPage() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to connect to Stripe.");
      }

      if (!data.url) {
        throw new Error("Stripe did not return an onboarding link.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to MarketHub
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CreditCard size={28} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Connect with Stripe
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Connect your Stripe account to receive payments when buyers
            purchase your MarketHub listings.
          </p>

          <form onSubmit={handleConnect} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Seller email address
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect with Stripe"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-green-600"
            />
            <p className="text-xs leading-5 text-gray-500">
              Your payment information is handled securely through
              Stripe&apos;s hosted onboarding process. MarketHub does not
              collect your bank details.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
