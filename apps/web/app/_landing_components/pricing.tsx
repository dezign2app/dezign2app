"use client";

import { useEffect, useState } from "react";
import { PlanCard, type BillingCycle, type Plan } from "./plan-card";

const Pricing = () => {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/checkout/subscription/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        const items = data.items || [];

        const mappedPlans: Plan[] = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          desc: item.description || "Simple description for this plan.",
          price: item.price / 100,
          billingPeriod: item.billing_period || "every-month",
          featured: item.metadata?.featured === "true" || false,
          features: item.metadata?.features ? item.metadata.features.split(",") : [],
        }));

        setPlans(mappedPlans.sort((a, b) => (a.price || 0) - (b.price || 0)));
      } catch (error) {
        console.error("Failed to fetch plans from Creem:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <section
      className="w-full bg-white text-black relative overflow-hidden py-24"
      id="pricing"
    >
      {/* Subtle radial bg */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] z-0"
        style={{
          background: "radial-gradient(ellipse, rgba(0,0,0,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 mb-12">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Pricing</p>
        <h2 className="text-3xl lg:text-4xl font-bold mb-3">
          Simple, Transparent Pricing
        </h2>
        <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
          Choose the plan that&apos;s right for you and start building with AI today.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
          {(["monthly", "annually"] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 capitalize ${
                billing === cycle
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {cycle === "annually" ? "Annually" : "Monthly"}
            </button>
          ))}
        </div>
        {billing === "annually" && (
          <p className="mt-3 text-xs text-green-600 font-medium">
            🎉 2 months free with annual billing
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="relative z-10 flex flex-wrap justify-center gap-5 px-6 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center w-full mt-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading plans...</p>
            </div>
          </div>
        ) : (
          plans
            .filter(
              (plan) =>
                plan.billingPeriod ===
                (billing === "monthly" ? "every-month" : "every-year")
            )
            .map((plan) => <PlanCard key={plan.id} plan={plan} billing={billing} />)
        )}
      </div>
    </section>
  );
};

export default Pricing;