"use client";

import { useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";
import { Minus, Plus, Info } from "lucide-react";
import Link from "next/link";

function CheckCircle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="black"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.2" />
      <path
        d="M5 8l2 2 4-4"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlanIconBadge() {
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center mb-5 bg-black">
      <div className="w-[14px] h-[14px] rounded-full border-2 border-white flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-white" />
      </div>
    </div>
  );
}

export function EarlyBelieverCard() {
  const { isSignedIn, isLoaded } = useUser();
  const [tier, setTier] = useState<500 | 1000>(1000);
  const [seats, setSeats] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const discountPercent = tier === 1000 ? 10 : 5;
  const totalAmount = tier * seats;

  const handleSeatsChange = (newSeats: number) => {
    if (isNaN(newSeats)) return;
    setSeats(Math.max(1, Math.min(100, newSeats)));
  };

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/checkout/early-believer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, seats }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please sign in to continue.");
          return;
        }
        throw new Error(data.error || "Checkout failed");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      console.error("Early believer checkout error:", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = `
    w-full mt-5 py-[13px] rounded-xl text-sm font-semibold transition-all duration-200
    bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800
  `;

  return (
    <div className="relative border border-gray-200 flex flex-col w-[450px] translate-y-0 rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1 shadow-lg bg-white/50">
      <PlanIconBadge />

      {/* Plan name + desc */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <p
            className="text-xl font-bold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Early Believer
          </p>
          <Link
            href="/early-believer"
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium hover:text-black bg-gray-100 rounded-md transition-colors"
            title="Read plan details and FAQ"
          >
            <span>read</span>
            <Info className="w-3 h-3" />
          </Link>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wider">
          {discountPercent}% OFF
        </span>
      </div>

      <div className="text-xs mb-4 text-gray-600 leading-normal">
        {tier === 1000
          ? `Includes $100 for product subscription + $900 investment for product development (locks in 10% lifetime discount).`
          : `Includes $50 for product subscription + $450 investment for product development (locks in 5% lifetime discount).`}
      </div>

      {/* Tier selector */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5">
          Select Tier
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTier(500)}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
              tier === 500
                ? "border-black bg-black text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            $500 <span className="text-[10px] opacity-80">(5% off)</span>
          </button>
          <button
            type="button"
            onClick={() => setTier(1000)}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
              tier === 1000
                ? "border-black bg-black text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            $1,000 <span className="text-[10px] opacity-80">(10% off)</span>
          </button>
        </div>
      </div>

      {/* Seat Stepper */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 flex justify-between items-center">
          <span>Seats Quantity</span>
          <span className="text-black font-bold">
            {seats} {seats === 1 ? "Seat" : "Seats"}
          </span>
        </div>
        <div className="flex items-center justify-between border border-gray-200 rounded-xl p-1 bg-gray-50">
          <button
            type="button"
            onClick={() => handleSeatsChange(seats - 1)}
            disabled={seats <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-black hover:bg-white disabled:opacity-30 transition-all"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min={1}
            max={100}
            value={seats}
            onChange={(e) => handleSeatsChange(parseInt(e.target.value) || 1)}
            className="w-12 text-center font-bold text-sm text-black bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => handleSeatsChange(seats + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-black hover:bg-white transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Price Display */}
      <div className="mb-1">
        <span className="flex items-end gap-1">
          <span
            className="text-4xl font-extrabold tracking-tight leading-none"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            ${totalAmount.toLocaleString()}
          </span>
          <span className="text-xs mb-1 text-gray-500">/ advance</span>
        </span>
      </div>

      {/* CTA Button */}
      {!isLoaded ? (
        <button
          disabled
          className={buttonStyle}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Loading...
        </button>
      ) : !isSignedIn ? (
        <SignInButton mode="modal" forceRedirectUrl="/#pricing">
          <button
            className={buttonStyle}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Get Started
          </button>
        </SignInButton>
      ) : (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className={buttonStyle}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {loading ? "Processing..." : "Get Started"}
        </button>
      )}

      {/* Features List */}
      <ul className="flex flex-col gap-2 mt-5 text-xs">
        {/* Product Subscription Portion */}
        <li className="flex items-start text-start gap-2">
          <CheckCircle />
          <span>
            <span className="font-semibold">
              ${tier === 1000 ? 100 * seats : 50 * seats} Product Subscription
            </span>
            <span className="font-normal text-gray-500">
              {" "}— Full access to current Beta tools. Once live, any remaining amount of your Beta subscription will be added directly to your live subscription plan.
            </span>
          </span>
        </li>

        {/* Investment Portion & Lifetime Discount */}
        <li>
          <div className="flex items-center gap-2 font-semibold text-start">
            <CheckCircle />
            <span>
              ${tier === 1000 ? 900 * seats : 450 * seats} Development Investment
            </span>
          </div>
          <ul className="pl-6 pt-1.5 flex flex-col gap-1.5 text-[11px] text-gray-600 text-start">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-black shrink-0 mt-1.5" />
              <span>
                Locks in <strong>{discountPercent}% lifetime discount</strong> on all future bills (capped at ${tier === 1000 ? "100K" : "50K"} per seat)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-black shrink-0 mt-1.5" />
              <span>Applies to upcoming AI-assisted system design &amp; testing tiers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-black shrink-0 mt-1.5" />
              <span>Applies to cloud deployment services &amp; all future subscription renewals</span>
            </li>
          </ul>
        </li>

        {/* Note */}
        <li className="flex items-start gap-2 mt-1 text-[11px] text-gray-400 italic text-start">
          <span>Note: AI system design, automated testing &amp; cloud services roll out with separate pricing tiers — your lifetime discount applies to all of them.</span>
        </li>
      </ul>
    </div>
  );
}
