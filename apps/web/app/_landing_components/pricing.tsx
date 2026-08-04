"use client";

import { useEffect, useState } from "react";
import { PlanCard, type BillingCycle, type Plan } from "./plan-card";
import { EarlyBelieverCard } from "./early-believer-card";

type PricingProps = {
  hideHeader?: boolean;
  hideToggle?: boolean;
  externalBilling?: BillingCycle;
};

interface CreemProductItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  billing_period?: string;
  billingPeriod?: string;
  billing_cycle?: string;
  billingCycle?: string;
  interval?: string;
  period?: string;
  metadata?: Record<string, string | undefined>;
}

function normalizeBillingPeriod(
  item: CreemProductItem,
): "every-month" | "every-year" {
  const period = String(
    item.billing_period ||
      item.billingPeriod ||
      item.billing_cycle ||
      item.billingCycle ||
      item.interval ||
      item.period ||
      item.metadata?.billing_period ||
      item.metadata?.billingPeriod ||
      "",
  ).toLowerCase();

  if (
    period.includes("year") ||
    period.includes("annual") ||
    period === "every-year" ||
    period === "every_year"
  ) {
    return "every-year";
  }
  return "every-month";
}

const Pricing = ({
  hideHeader = false,
  hideToggle = false,
  externalBilling,
}: PricingProps) => {
  const [internalBilling, setInternalBilling] =
    useState<BillingCycle>("monthly");
  const billing = externalBilling || internalBilling;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/checkout/subscription/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        const rawItems: CreemProductItem[] = data.items || [];
        const items = rawItems.filter((item: CreemProductItem) => {
          const name = String(item.name || "").toLowerCase();
          const desc = String(item.description || "").toLowerCase();
          const metaType = String(item.metadata?.type || "").toLowerCase();
          return (
            !name.includes("early believer") &&
            !desc.includes("early believer") &&
            metaType !== "early_believer"
          );
        });

        if (items.length === 0) {
          setPlans([]);
          return;
        }

        const mappedPlans: Plan[] = items.map((item: CreemProductItem) => {
          let featuresList: string[] = item.metadata?.features
            ? item.metadata.features
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

          if (featuresList.length === 0) {
            featuresList = [
              "Full-Stack Monorepo Code Generation",
              "Visual Architecture Graph to Code Compiler",
              "Data Flow Simulation (Load test system designs before shipping)",
              "Priority Implementation of Your Custom Stack & Products",
            ];
          }

          const rawDesc = item.description || "";
          const isLongOrBulleted =
            rawDesc.includes("\n") ||
            rawDesc.includes("Features") ||
            rawDesc.length > 80;
          const cleanDesc = isLongOrBulleted
            ? "Everything you need to compile system architecture into production code."
            : rawDesc || "Everything you need to compile system architecture into production code.";

          return {
            id: item.id,
            name: item.name,
            desc: cleanDesc,
            price: item.price ? item.price / 100 : 0,
            billingPeriod: normalizeBillingPeriod(item),
            featured: item.metadata?.featured === "true",
            features: featuresList,
          };
        });

        setPlans(mappedPlans.sort((a, b) => (a.price || 0) - (b.price || 0)));
      } catch (error) {
        console.error("Failed to fetch plans from Creem:", error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <section
      className="w-full bg-transparent text-black relative overflow-hidden py-12 scroll-mt-14"
      id="pricing"
    >
      {/* Subtle radial bg */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] z-0"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 mb-12">
        {/* Billing toggle */}
        {!hideToggle && (
          <>
            <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
              {(["monthly", "annually"] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setInternalBilling(cycle)}
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
          </>
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
          <>
            {plans
              .filter(
                (plan) =>
                  plan.billingPeriod ===
                  (billing === "monthly" ? "every-month" : "every-year"),
              )
              .map((plan) => (
                <PlanCard key={plan.id} plan={plan} billing={billing} />
              ))}
            <EarlyBelieverCard />
          </>
        )}
      </div>
    </section>
  );
};

export default Pricing;
