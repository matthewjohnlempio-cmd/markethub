
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function ConnectRefreshPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    async function refreshOnboarding() {
      const email = new URLSearchParams(window.location.search).get("email");

      if (!email) {
        setError("Seller email was not provided.");
        return;
      }

      try {
        const response = await fetch("/api/stripe/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok || !data.url) {
          throw new Error(data.error || "Unable to refresh onboarding.");
        }

        window.location.href = data.url;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      }
    }

    refreshOnboarding();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              Unable to Continue
            </h1>
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <Link
              href="/connect"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Try Again
            </Link>
          </>
        ) : (
          <>
            <Loader2
              size={44}
              className="mx-auto mb-4 animate-spin text-blue-600"
            />
            <h1 className="text-xl font-bold text-gray-900">
              Refreshing Stripe Onboarding
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while we generate a new secure onboarding link.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
