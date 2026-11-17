
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  ShoppingBag,
  Plus,
  Home,
  Laptop,
  Car,
  Shirt,
  Sofa,
  Trees,
  Dumbbell,
  BookOpen,
  Package,
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

const categories = [
  { name: "All", icon: Home },
  { name: "Electronics", icon: Laptop },
  { name: "Vehicles", icon: Car },
  { name: "Clothing", icon: Shirt },
  { name: "Furniture", icon: Sofa },
  { name: "Home & Garden", icon: Trees },
  { name: "Sports & Outdoors", icon: Dumbbell },
  { name: "Books", icon: BookOpen },
  { name: "Other", icon: Package },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
        setError("Unable to load listings. Please try again.");
      } else {
        setListings((data ?? []) as Listing[]);
      }

      setLoading(false);
    }

    fetchListings();
  }, []);

  const filteredListings = listings.filter((listing) => {
    const matchesCategory =
      activeCategory === "All" ||
      listing.category === activeCategory;

    const matchesSearch =
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShoppingBag size={22} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Market<span className="text-blue-600">Hub</span>
            </span>
          </Link>

          <div className="hidden flex-1 md:block">
            <div className="flex h-11 max-w-xl items-center gap-3 rounded-xl bg-gray-100 px-4">
              <Search size={19} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for anything..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="ml-auto">
            <Link
              href="/create"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={19} />
              Sell an item
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-7">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-blue-600">
            YOUR LOCAL MARKETPLACE
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find your next great deal.
          </h1>

          <p className="mt-2 text-gray-500">
            Buy and sell items with people in your community.
          </p>
        </div>

        <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const active = activeCategory === category.name;

            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={17} />
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="mb-5">
          <h2 className="text-xl font-bold">Recently listed</h2>
          <p className="mt-1 text-sm text-gray-500">
            {listings.length} items available in the marketplace
          </p>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              Loading marketplace...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white py-16 text-center">
            <p className="font-semibold text-red-600">{error}</p>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-4">
                  <p className="text-lg font-bold">
                    ₱{Number(listing.price).toLocaleString("en-PH")}
                  </p>

                  <h3 className="mt-1 truncate text-sm font-semibold text-gray-800">
                    {listing.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {listing.category}
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={13} />
                    Marketplace
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <ShoppingBag
              className="mx-auto mb-3 text-gray-300"
              size={40}
            />

            <h3 className="font-semibold">No items found</h3>

            <p className="mt-1 text-sm text-gray-500">
              {listings.length === 0
                ? "Be the first to publish something!"
                : "Try another search or category."}
            </p>

            {listings.length === 0 && (
              <Link
                href="/create"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Create your first listing
              </Link>
            )}
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white py-7 text-center text-sm text-gray-400">
        © 2026 MarketHub. Your community marketplace.
      </footer>
    </div>
  );
}
