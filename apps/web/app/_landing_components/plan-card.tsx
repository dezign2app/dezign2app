import ReactMarkdown from "react-markdown";
import { SubscribeButton } from "./subscribe-button";

export type BillingCycle = "monthly" | "annually";

export interface Plan {
  id: string;
  name: string;
  desc: string;
  price: number | null;
  billingPeriod: string;
  freeLabel?: string;
  featured: boolean;
  features: string[];
}

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

function PlanIconBadge({ featured }: { featured: boolean }) {
  return (
    <div
      className={`w-11 h-11 rounded-full flex items-center justify-center mb-5 bg-black`}
    >
      <div className="w-[14px] h-[14px] rounded-full border-2 border-white flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-white" />
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  billing: BillingCycle;
}

export function PlanCard({ plan, billing }: PlanCardProps) {
  const { id, name, desc, price, billingPeriod, freeLabel, featured, features } = plan;

  console.log(id);
  const displayPrice = price;

  return (
    <div
      className={`
        relative border border-gray-200 flex flex-col w-[300px] translate-y-0 rounded-2xl p-7 transition-transform duration-300
        hover:-translate-y-1 shadow-lg "
      `}
    >
      <PlanIconBadge featured={featured} />

      {/* Plan name + desc */}
      <p
        className="text-xl font-bold mb-1"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {name}
      </p>
      <div className="text-xs mb-6 prose prose-neutral prose-sm max-w-none prose-p:leading-normal prose-p:mb-0">
        <ReactMarkdown>{desc}</ReactMarkdown>
      </div>

      {/* Price */}
      <div className="mb-1">
        {freeLabel ? (
          <span
            className="text-sm font-extrabold tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {freeLabel}
          </span>
        ) : (
          <span className="flex items-end gap-1">
            <span
              className="text-4xl font-extrabold tracking-tight leading-none"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              ${displayPrice}
            </span>
            <span className="text-xs mb-2">/ {billingPeriod === "every-year" ? "per year" : "per month"}</span>
          </span>
        )}
      </div>
      
      {/* CTA */}
      <SubscribeButton productId={id} />
      <ul className="flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs">
            <CheckCircle />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
