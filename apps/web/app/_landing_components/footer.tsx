"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Blockchain04Icon } from "@hugeicons/core-free-icons";

const footerLinks = {
  Product: [
    { name: "Workflows", href: "/workflows" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Templates", href: "/workflows" },
    { name: "Docs", href: "/docs" },
  ],
  Resources: [
    { name: "Guides", href: "/docs" },
    { name: "API Portal", href: "/api-keys" },
    { name: "Support", href: "mailto:support@flowify.com" },
    { name: "Changelog", href: "/changelog" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-950 text-white py-16 px-8 flex justify-center border-t border-gray-800">
      <div className="w-full max-w-6xl flex flex-col gap-12 px-4">
        {/* Top row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-xs">
            <Link href="/" className="flex gap-2 items-center group">
              <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                <HugeiconsIcon icon={Blockchain04Icon} className="text-black size-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white">Flowify</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Visual builders, stateful LangGraph agents, and seamless tool integrations.
              Design, run, and scale AI-agent workflows with zero friction.
            </p>
            {/* Social links */}
            <div className="flex gap-3 mt-1">
              {["GitHub", "Twitter", "Discord"].map((s) => (
                <span key={s} className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors cursor-pointer font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-12">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="flex flex-col gap-3 min-w-[100px]">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{category}</h4>
                {links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-gray-600">
            © {currentYear} Flowify Inc. All rights reserved. Created by Subhash.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-600">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
