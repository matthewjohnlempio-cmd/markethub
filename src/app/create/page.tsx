
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  X,
  Loader2,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const categories = [
  "Electronics",
  "Vehicles",
  "Clothing",
  "Furniture",
  "Home & Garden",
  "Sports & Outdoors",
  "Books",
  "Other",
];

export default function CreateListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!image) {
      setError("Please upload a product photo.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setLoading(true);

    try {
      const fileExtension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `listings/${fileName}`;

      // Upload product photo to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("marketplace-images")
        .upload(filePath, image, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public image URL
      const { data: imageData } = supabase.storage
        .from("marketplace-images")
        .getPublicUrl(filePath);

      // Save listing to Supabase database
      const { data, error: insertError } = await supabase
        .from("marketplace_listings")
        .insert({
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          email: email.trim().toLowerCase(),
          category,
          image_url: imageData.publicUrl,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      router.push(`/listing/${data.id}`);
    } catch (err) {
      console.error("Listing creation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
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
            Back to marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-blue-600">
            SELL SOMETHING
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Create a listing
          </h1>

          <p className="mt-2 text-gray-500">
            Share your item with people in your community.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <label className="mb-3 block text-sm font-semibold">
              Product Photo
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0])}
            />

            {preview ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                <img
                  src={preview}
                  alt="Product preview"
                  className="h-64 w-full object-contain bg-gray-50"
                />

                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(preview);
                    setPreview("");
                    setImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-12 transition hover:border-blue-400 hover:bg-blue-50/40"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <ImagePlus size={26} />
                </div>

                <span className="text-sm font-semibold">
                  Upload a product photo
                </span>

                <span className="mt-1 text-xs text-gray-400">
                  JPG, PNG or WEBP · Maximum 5MB
                </span>
              </button>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Product Title
            </label>
            <input
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 14 Pro Max"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Description
            </label>
            <textarea
              required
              maxLength={2000}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item, its condition, and other important details..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Price (PHP)
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 px-4 focus-within:border-blue-500">
                <span className="font-semibold text-gray-500">₱</span>
                <input
                  required
                  type="number"
                  min="0"
                  max="9999999999"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Category
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Seller Email
            </label>
            <input
              required
              type="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-2 text-xs text-gray-400">
              Buyers can use this information to contact you about your item.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Publishing listing...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Publish Listing
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Your listing will be visible to everyone.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
