
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

export default function ConnectReturnPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAccount() {
      const email = new URLSearchParams(window.location.search).get("email");

      if (!email) {
        setError("Seller email was not provided.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/stripe/connect/status?email=${encodeURIComponent(email)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to check your Stripe account.");
        }

        setConnected(data.connected);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    checkAccount();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {loading ? (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-blue-600" size={44} />
            <h1 className="text-xl font-bold text-gray-900">
              Checking your Stripe account
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while we verify your onboarding status.
            </p>
          </>
        ) : connected ? (
          <>
            <CheckCircle className="mx-auto mb-4 text-green-600" size={52} />
            <h1 className="text-2xl font-bold text-gray-900">
              Stripe Connected!
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Your Stripe account is ready. Buyers can now purchase your
              MarketHub listings.
            </p>
            <Link
              href="/"
              className="mt-7 inline-block w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Return to MarketHub
            </Link>
          </>
        ) : (
          <>
            <AlertCircle className="mx-auto mb-4 text-amber-500" size={48} />
            <h1 className="text-2xl font-bold text-gray-900">
              Onboarding Not Complete
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              {error ||
                "Your Stripe account has not been fully enabled for payments and payouts yet."}
            </p>
            <Link
              href="/connect"
              className="mt-7 inline-block w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Continue Stripe Setup
            </Link>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-gray-500 hover:text-blue-600"
            >
              Return to MarketHub
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
