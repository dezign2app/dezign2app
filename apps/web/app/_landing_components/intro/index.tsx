"use client";
import React from "react";
import Link from "next/link";

const perks = [
  "No vendor lock-in",
  "No 100-page reports",
  "We just ship",
];

const techLogos = [
  { name: "Inngest" },
  { name: "LangGraph" },
  { name: "Gemini" },
  { name: "OpenAI" },
  { name: "Convex" },
  { name: "Postgres" },
  { name: "Clerk" },
  { name: "Next.js" },
];

const Intro = () => {
  return (
    <div className="w-full flex flex-col items-center">
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="w-full flex flex-col items-center text-center px-6 pt-24 pb-20 gap-8 bg-white relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #f0f0f0 1px, transparent 1px),
              linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Fade overlay — edges */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, transparent 40%, white 100%)",
          }}
        />

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-16 h-16 border border-gray-200 rounded-xl z-0" />
        <div className="absolute top-8 right-8 w-16 h-16 border border-gray-200 rounded-xl z-0" />
        <div className="absolute bottom-8 left-8 w-10 h-10 border border-gray-200 rounded-lg z-0" />
        <div className="absolute bottom-8 right-8 w-10 h-10 border border-gray-200 rounded-lg z-0" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-gray-300 rounded-full px-4 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              AI Agents for Modern Teams
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight text-black">
            Build agents that<br />
            get{" "}
            <span
              className="relative inline-block"
              style={{
                WebkitTextStroke: "2px black",
                color: "transparent",
              }}
            >
              real work
            </span>
            {" "}done
          </h1>

          {/* Subtitle */}
          <p className="text-sm lg:text-base text-gray-500 leading-relaxed max-w-lg">
            We turn messy, people-heavy workflows into AI-powered production
            pipelines — so you can scale like software, not like headcount.
          </p>

          {/* CTA */}
          <Link
            href="/sign-up"
            className="bg-black text-white text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 group shadow-lg shadow-black/10"
          >
            Get Started
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>

          {/* Perks */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-1">
            {perks.map((perk) => (
              <span key={perk} className="flex items-center gap-2 text-xs text-gray-500">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="shrink-0"
                >
                  <circle cx="7" cy="7" r="6.5" stroke="#111" />
                  <path
                    d="M4.5 7l1.8 1.8 3.2-3.6"
                    stroke="#111"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {perk}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial / Social Proof ─────────────────── */}
      <div className="w-full py-10 px-6 flex flex-col items-center gap-4">
        <p className="text-lg lg:text-xl font-bold text-center max-w-xl">
          &ldquo;143 Hours Saved Monthly&rdquo;
        </p>
        <p className="text-xs text-center max-w-md leading-relaxed">
          What used to take us 60 minutes now takes 5. Flowify saved us 90% of
          the time and drastically cut our operational overhead.
        </p>
        <div className="flex items-center gap-3 mt-1">
          <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-xs font-bold">S</div>
          <div className="text-left">
            <p className="text-xs font-semibold">Hash</p>
            <p className="text-[10px]">Founder, SaaS Co.</p>
          </div>
        </div>
      </div>

      {/* ── Trusted Stack ──────────────────────────────── */}
      <div className="w-full bg-white border-b border-gray-100 py-7 px-6 flex flex-col items-center gap-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
          Powered by the best in the stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {techLogos.map((logo) => (
            <span
              key={logo.name}
              className="text-xs font-bold text-gray-300 hover:text-gray-600 transition-colors tracking-wide cursor-default select-none"
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Intro;