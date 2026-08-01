import React from "react";
import Link from "next/link";
import { Header } from "../_landing_components/header";
import { Footer } from "../_landing_components/footer";
import { Metadata } from "next";
import { Sparkles, Users, Target, Rocket, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | dezign2app",
  description:
    "Learn about the mission, team, and technology behind dezign2app visual design engine.",
};

export default function AboutPage() {
  return (
    <div className="max-w-screen min-h-screen w-full bg-white text-black flex flex-col items-center overflow-x-hidden">
      <Header />

      <main className="w-full max-w-4xl px-6 py-12 md:py-20 flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black text-white text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>Our Mission</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Bridging Visual Design & System Architecture
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl">
            dezign2app empowers software engineers and product teams to design,
            iterate, and deploy full-stack web applications straight from
            interactive visual canvases.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Why we built dezign2app
            </h2>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              Software design and system architecture have historically been
              separated into disparate diagrams, Figma wireframes, and
              hand-coded implementations.
            </p>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              We built dezign2app to unify the entire creation process — giving
              creators a real-time canvas where visual components compiled into
              production-ready React, Next.js, and TypeScript code
              automatically.
            </p>
          </div>

          <div className="p-8 bg-gray-50 border border-gray-200 rounded-3xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-gray-900">Core Values</h3>
            <ul className="flex flex-col gap-3 text-xs text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-black">•</span>
                <span>
                  <strong>Speed & Precision:</strong> From prompt to production
                  code in seconds.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-black">•</span>
                <span>
                  <strong>Developer First:</strong> Clean, maintainable code
                  output with standard Tailwind CSS.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-black">•</span>
                <span>
                  <strong>Extensibility:</strong> Open API integration pipelines
                  for enterprise workflows.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="p-8 bg-gray-900 text-white rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold">
              Have questions or want to partner?
            </h3>
            <p className="text-xs text-gray-300">
              Reach out to our founding team anytime.
            </p>
          </div>
          <a
            href="mailto:founder@dezign2app.com"
            className="px-6 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-100 transition-all shrink-0"
          >
            founder@dezign2app.com
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
