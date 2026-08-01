import React from "react";
import Link from "next/link";
import { Header } from "../_landing_components/header";
import { Footer } from "../_landing_components/footer";
import { Metadata } from "next";
import { Newspaper, Sparkles, Calendar, User, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Engineering Insights | dezign2app",
  description:
    "Read the latest engineering updates, system architecture design patterns, and product announcements from dezign2app.",
};

const posts = [
  {
    title: "Introducing dezign2app 2.0: AI-Powered Visual System Architecture",
    date: "July 20, 2026",
    author: "dezign2app Team",
    snippet:
      "Discover how our new multi-tenant canvas engine compiles interactive diagrams into production React components in real time.",
  },
  {
    title:
      "How We Built a Real-Time Collaborative Canvas with Convex and React",
    date: "July 12, 2026",
    author: "Engineering",
    snippet:
      "A deep dive into reactive state sync, optimistic updates, and multi-user cursor tracking.",
  },
  {
    title:
      "Why Modern Software Development is Shifting Toward Visual Engineering",
    date: "June 28, 2026",
    author: "Product Strategy",
    snippet:
      "Exploring how visual node graphs accelerate software delivery for tech leads and startups alike.",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-screen min-h-screen w-full bg-white text-black flex flex-col items-center overflow-x-hidden">
      <Header />

      <main className="w-full max-w-4xl px-6 py-12 md:py-20 flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black text-white text-xs font-semibold">
            <Newspaper className="size-3.5" />
            <span>Blog & Insights</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Engineering, Design & Product Updates
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-xl">
            Articles and technical deep dives from the creators of dezign2app.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {posts.map((post, idx) => (
            <article
              key={idx}
              className="p-6 border border-gray-200 rounded-2xl bg-white flex flex-col gap-3 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {post.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {post.author}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                {post.snippet}
              </p>
              <Link
                href="/docs"
                className="text-xs font-semibold text-black hover:underline inline-flex items-center gap-1 mt-1"
              >
                Read Article →
              </Link>
            </article>
          ))}
        </div>

        {/* Contact Support */}
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-gray-900">
              Want to contribute a guest post?
            </h3>
            <p className="text-xs text-gray-600">
              Get in touch with our editorial team.
            </p>
          </div>
          <a
            href="mailto:founder@dezign2app.com"
            className="px-5 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all shrink-0"
          >
            founder@dezign2app.com
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
