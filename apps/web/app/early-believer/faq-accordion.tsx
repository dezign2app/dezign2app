"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const faqs: FaqItem[] = [
  {
    question: "What is the Early Believer Program?",
    answer: (
      <p>
        The Early Believer Program is an exclusive early-backer initiative for
        supporters who contribute upfront to fuel dezign2app&apos;s product
        development. In exchange, backers receive upfront subscription access (6
        months or 1 year per seat) plus a permanent lifetime discount (5% or
        10%) applied to all future workspace renewal bills.
      </p>
    ),
  },
  {
    question:
      "How do the 10% ($100K cap) and 5% ($50K cap) discount caps work over time?",
    answer: (
      <div className="flex flex-col gap-2">
        <p>
          Your lifetime discount percentage (10% for the $1,000 tier, 5% for the
          $500 tier) automatically reduces every future recurring invoice for
          your workspace (including annual renewals, additional seat additions,
          and core subscription upgrades).
        </p>
        <p>To maintain fair usage at scale, lifetime savings are capped at:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1 text-gray-600">
          <li>
            <strong>$1,000 Tier (10% OFF):</strong> Total cumulative discount
            capped at <strong>$100,000 in savings</strong> on your account over
            the years.
          </li>
          <li>
            <strong>$500 Tier (5% OFF):</strong> Total cumulative discount
            capped at <strong>$50,000 in savings</strong> on your account over
            the years.
          </li>
        </ul>
        <p>
          Once your workspace saves the full capped amount ($100k or $50k),
          standard non-discounted billing resumes automatically.
        </p>
      </div>
    ),
  },
  {
    question: "How do seat quantities and upfront payments work?",
    answer: (
      <div className="flex flex-col gap-2">
        <p>
          You can select anywhere between 1 to 100 seats during checkout. The
          total upfront cost is calculated as{" "}
          <code>Tier Price × Number of Seats</code>.
        </p>
        <p>
          Each seat grants full workspace membership and allocates either 1 Year
          (for the $1,000 tier) or 6 Months (for the $500 tier) of subscription
          access per seat.
        </p>
      </div>
    ),
  },
  {
    question:
      "How does the Beta phase work and will future AI features require a plan upgrade?",
    answer: (
      <p>
        dezign2app is currently in Beta with core platform features enabled. All
        plans (including annual subscription packs and Early Believer tiers)
        grant complete access to our Beta platform capabilities. As advanced AI
        features roll out in the future, accessing those advanced AI
        capabilities may require upgrading your plan — and your locked-in 5% or
        10% lifetime discount will automatically apply to any future plan
        upgrades or add-on packages!
      </p>
    ),
  },
  {
    question: "Can I add more seats later or change my workspace seats?",
    answer: (
      <p>
        Yes! You can manage and add seats anytime from your workspace settings.
        Any additional seats added to your workspace in the future will
        automatically receive your locked-in 5% or 10% lifetime discount.
      </p>
    ),
  },
  {
    question: "How does the discount cap work if I purchase multiple seats?",
    answer: (
      <div className="flex flex-col gap-2">
        <p>
          The discount cap is allocated per purchased seat. For example, in the
          $1,000 tier (10% OFF), each seat carries a $100,000 cumulative
          discount allowance ($50,000 for the $500 tier).
        </p>
        <p>
          If the lifetime discount savings on your 1st seat are exhausted over
          time, your workspace automatically rolls over to avail the 10%
          discount against your 2nd seat&apos;s discount pool, then your 3rd
          seat, and so on. For instance, purchasing 2 seats at the $1,000 tier
          grants your workspace a total cumulative discount cap of{" "}
          <strong>$200,000</strong>!
        </p>
      </div>
    ),
  },
  {
    question: "What capabilities and automation does dezign2app provide?",
    answer: (
      <p>
        dezign2app delivers end-to-end software development automation by
        unifying{" "}
        <strong>
          system architecture design, code generation, automated testing, CI/CD
          pipelines, cloud infrastructure provisioning, real-time monitoring,
          and system maintenance
        </strong>{" "}
        into a single seamless platform.
      </p>
    ),
  },
  {
    question:
      "Can lifetime discounts be combined with other promotional codes?",
    answer: (
      <p>
        Your Early Believer discount represents our best possible recurring
        workspace rate. While it cannot be stacked on top of limited-time
        seasonal promos, the Early Believer discount applies automatically to
        your standard subscription renewals for years to come.
      </p>
    ),
  },
];

export function EarlyBelieverFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full flex flex-col gap-3 max-w-3xl mx-auto">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border border-gray-200 rounded-2xl bg-white overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none hover:bg-gray-50/80 transition-colors"
            >
              <span className="font-bold text-sm md:text-base text-gray-900">
                {faq.question}
              </span>
              <div
                className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180 bg-gray-200" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4 text-gray-700" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-gray-600 border-t border-gray-100 leading-relaxed bg-gray-50/40">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
