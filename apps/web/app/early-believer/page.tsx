import React from "react";
import Link from "next/link";
import { Header } from "../_landing_components/header";
import { Footer } from "../_landing_components/footer";
import { Metadata } from "next";
import {
  CheckCircle2,
  Sparkles,
  Users,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { EarlyBelieverFaq } from "./faq-accordion";

export const metadata: Metadata = {
  title: "Early Believer Program | dezign2app",
  description:
    "Thank you for believing in us early! Learn all details about the Early Believer plan, seat allocations, 10% & 5% lifetime discount capping ($100K/$50K total discount), and FAQs.",
};

export default function EarlyBelieverPage() {
  return (
    <div className="max-w-screen min-h-screen w-full bg-white text-black flex flex-col items-center overflow-x-hidden">
      <Header />

      <main className="w-full max-w-5xl px-6 py-12 md:py-20 flex flex-col gap-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Early Believer Program</span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.15]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Thanks for believing in us this early.
          </h1>

          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            By joining as an Early Believer, you provide crucial early support
            to our mission of automating the entire software development lifecycle — combining
            system architecture design, code generation, automated testing, CI/CD pipelines,
            cloud infrastructure, real-time monitoring & maintenance into one platform. In return,
            we lock in permanent, lifetime discount privileges for your entire workspace.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/#pricing"
              className="px-6 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md flex items-center gap-2 group"
            >
              <span>Get Started as Early Believer</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#faq"
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Read FAQs ↓
            </a>
          </div>
        </div>

        {/* Tier Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* 10% Tier ($1,000) */}
          <div className="relative border-2 border-black rounded-3xl p-8 bg-gradient-to-b from-neutral-50 to-white shadow-xl flex flex-col justify-between">
            <div className="absolute -top-3.5 right-6 bg-black text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  $1,000 / seat
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  10% LIFETIME OFF
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                1-Year Annual Pack Tier
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Includes 1 Full Year Subscription pack + $900 investment
                contribution for a 10% lifetime discount on all future workspace
                bills.
              </p>

              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl mb-6">
                <div className="text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Discount Cap: Up to $100,000 Total Discount</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  Your 10% discount applies to every future invoice until your
                  total cumulative savings across the years reach{" "}
                  <strong>$100,000</strong>.
                </p>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-gray-700 mb-8">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>
                    <strong>1 Year (Annual)</strong> subscription included per seat{" "}
                    <span className="font-normal text-gray-500">
                      (AI features may require plan upgrades in the future)
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>
                    <strong>10% OFF forever</strong> on all future product renewals & team seats
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>Full access to System Design suite & Beta platform tools</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>Priority early access to all new roadmap releases</span>
                </li>
              </ul>
            </div>

            <Link
              href="/#pricing"
              className="w-full py-3 rounded-xl bg-black text-white text-xs font-semibold text-center hover:bg-neutral-800 transition-all shadow-sm"
            >
              Select $1,000 Tier
            </Link>
          </div>

          {/* 5% Tier ($500) */}
          <div className="relative border border-gray-200 rounded-3xl p-8 bg-white shadow-lg flex flex-col justify-between hover:border-gray-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  $500 / seat
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  5% LIFETIME OFF
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                6-Months Pack Tier
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Includes 6 Months Subscription pack + $450 investment
                contribution for a 5% lifetime discount on all future workspace
                bills.
              </p>

              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl mb-6">
                <div className="text-xs font-bold text-blue-950 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Discount Cap: Up to $50,000 Total Discount</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-normal">
                  Your 5% discount applies to every future invoice until your
                  total cumulative savings across the years reach{" "}
                  <strong>$50,000</strong>.
                </p>
              </div>

              <ul className="flex flex-col gap-3 text-xs text-gray-700 mb-8">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>
                    <strong>6 Months</strong> subscription included per seat{" "}
                    <span className="font-normal text-gray-500">
                      (AI features may require plan upgrades in the future)
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>
                    <strong>5% OFF forever</strong> on all future product renewals & team seats
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>Full access to System Design suite & Beta platform tools</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span>Standard early supporter status & priority support</span>
                </li>
              </ul>
            </div>

            <Link
              href="/#pricing"
              className="w-full py-3 rounded-xl bg-gray-900 text-white text-xs font-semibold text-center hover:bg-black transition-all shadow-sm"
            >
              Select $500 Tier
            </Link>
          </div>
        </div>

        {/* Plan & Seat Mechanics Detail Section */}
        <section className="flex flex-col gap-8 border-t border-b border-gray-100 py-12">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              <Users className="w-4 h-4" />
              <span>Program Rules & Seat Mechanics</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              How the Early Believer Plan Works
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
              Here is everything you need to know about purchasing seats, how total discount caps work, and future AI upgrades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-gray-900">
                Seat Allocation & Rollover
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Each seat carries its own discount cap allowance ($100k for 10% tier / $50k for 5% tier). If the discount savings allowance on seat #1 is exhausted over the years, your workspace automatically rolls over to avail the discount with seat #2, seat #3, and beyond!
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-gray-900">
                End-to-End Platform Automation
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                dezign2app delivers unified automation combining <strong>system architecture design, code generation, automated testing, CI/CD pipelines, cloud infrastructure, real-time monitoring & maintenance</strong> into one platform.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-gray-900">
                Beta Status & Future AI Upgrades
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                dezign2app is currently in Beta with core platform features enabled.
                As we roll out advanced AI capabilities in the future, accessing those advanced AI features
                may require upgrading your plan. Your locked-in 5% or 10% lifetime discount will automatically apply
                to all future plan upgrades & add-ons!
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="flex flex-col gap-8 scroll-mt-20">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-600 max-w-xl">
              Everything you need to know about the Early Believer backing program,
              lifetime discounts, caps, and billing.
            </p>
          </div>

          <EarlyBelieverFaq />
        </section>

        {/* Bottom Callout */}
        <div className="p-8 md:p-12 rounded-3xl bg-neutral-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="flex flex-col gap-2 max-w-xl">
            <h3 className="text-2xl font-bold tracking-tight">
              Ready to lock in your lifetime discount?
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Join early supporters building with dezign2app today. Choose your
              seats and tier on our pricing card.
            </p>
          </div>

          <Link
            href="/#pricing"
            className="px-6 py-3.5 rounded-xl bg-white text-black text-xs md:text-sm font-bold hover:bg-neutral-100 transition-all shrink-0 shadow-md"
          >
            Go to Pricing & Get Started →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
