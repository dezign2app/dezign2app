import React from "react";
import Link from "next/link";
import { Header } from "../_landing_components/header";
import { Footer } from "../_landing_components/footer";
import { Metadata } from "next";
import { History, Sparkles, CheckCircle2, Zap, Github } from "lucide-react";

export const metadata: Metadata = {
  title: "Changelog | dezign2app",
  description:
    "Recent product updates, new features, and improvements in dezign2app.",
};

const releases = [
  {
    version: "v2.4.0",
    date: "July 23, 2026",
    title: "Public Footer Navigation & Support Channel Integration",
    features: [
      "Made all public routes and policy pages accessible without authentication.",
      "Added direct customer support channel founder@dezign2app.com across all landing sections.",
      "Updated social profile links for X, Instagram, LinkedIn, and GitHub.",
      "Enhanced Documentation and Workflow showcase hubs.",
    ],
  },
  {
    version: "v2.3.0",
    date: "July 15, 2026",
    title: "Real-Time Canvas Collaboration & Convex Engine",
    features: [
      "Optimized multi-user presence indicators.",
      "Added drag and drop system design primitive node palettes.",
      "Improved export code formatting for Next.js 16.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-screen min-h-screen w-full bg-white text-black flex flex-col items-center overflow-x-hidden">
      <Header />

      <main className="w-full max-w-4xl px-6 py-12 md:py-20 flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black text-white text-xs font-semibold">
            <History className="size-3.5" />
            <span>Product Releases</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Changelog & Release Notes
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-xl">
            Stay up to date with new features, bug fixes, and performance
            improvements.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {releases.map((rel, idx) => (
            <div
              key={idx}
              className="p-8 border border-gray-200 rounded-3xl bg-white flex flex-col gap-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-lg font-mono">
                    {rel.version}
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">
                    {rel.title}
                  </h2>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {rel.date}
                </span>
              </div>

              <ul className="flex flex-col gap-2.5 text-xs md:text-sm text-gray-700">
                {rel.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-black shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-gray-900">
              Have a feature request or feedback?
            </h3>
            <p className="text-xs text-gray-600">
              Email our engineering team directly.
            </p>
          </div>
          <a
            href="https://github.com/dezign2app/dezign2app/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 flex bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all shrink-0"
          >
            <Github />
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
