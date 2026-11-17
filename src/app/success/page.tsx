
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, ShoppingBag } from "lucide-react";

type Order = {
  id: string;
  listing_id: string;
  amount_total: number;
  status: string;
};

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    );

    if (!sessionId) {
      setError("No checkout session was provided.");
      setLoading(false);
      return;
    }

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function checkOrder() {
      try {
        const response = await fetch(
          `/api/stripe/orders/status?session_id=${encodeURIComponent(sessionId!)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to verify your order.");
        }

        if (data.confirmed && data.order) {
          setOrder(data.order);
          setLoading(false);
          return;
        }

        attempts += 1;

        if (attempts < 10) {
          timer = setTimeout(checkOrder, 2000);
        } else {
          setError(
            "Your payment may have succeeded, but confirmation is taking longer than expected. Please check again shortly."
          );
          setLoading(false);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify your payment."
        );
        setLoading(false);
      }
    }

    checkOrder();

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {loading ? (
          <>
            <Loader2
              size={48}
              className="mx-auto mb-5 animate-spin text-blue-600"
            />
            <h1 className="text-xl font-bold text-gray-900">
              Confirming Your Payment
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Please wait while we confirm your payment and save your order.
            </p>
          </>
        ) : order ? (
          <>
            <CheckCircle
              size={56}
              className="mx-auto mb-5 text-green-600"
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Successful!
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Thank you for shopping with MarketHub. Your order has been
              confirmed and saved successfully.
            </p>

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Order details
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Order ID: <span className="font-semibold">{order.id}</span>
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Amount paid:{" "}
                <span className="font-semibold">
                  ₱{(order.amount_total / 100).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Status:{" "}
                <span className="font-semibold text-green-600">Paid</span>
              </p>
            </div>

            <Link
              href="/"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              Payment Confirmation Pending
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              {error}
            </p>
            <Link
              href="/"
              className="mt-7 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Return to MarketHub
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
