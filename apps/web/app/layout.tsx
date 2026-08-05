import { Geist, Geist_Mono, Ubuntu } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@workspace/ui/globals.css";
import { Providers } from "@/providers";
import { Metadata } from "next";

import { PaywallModal } from "@/components/paywall-modal";

import "./global.css";

const ubuntu = Ubuntu({ variable: "--font-sans", weight: ["300", "400"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dezign2app.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Dezign 2 App | AI-Powered System Design & Software Engineering Platform",
    template: "%s | Dezign 2 App",
  },
  description:
    "System design as a programming language. Automate your entire software development lifecycle — turning PRDs, architecture topologies, and data schemas into full-stack code, microservices, load tests, and cloud deployments with AI.",
  keywords: [
    "system design as a programming language",
    "AI software engineering",
    "system design platform",
    "architecture to code",
    "full-stack code generator",
    "monorepo compiler",
    "kafka node compiler",
    "redis node compiler",
    "autonomous SDLC",
    "dezign2app",
    "dezign 2 app",
  ],
  authors: [{ name: "Dezign 2 App Team" }],
  creator: "subhash",
  publisher: "Dezign 2 App",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Dezign 2 App",
    title: "Dezign 2 App | Describe the system. Ship the product.",
    description:
      "Automating the entire software development lifecycle — combining system architecture design, code generation, automated testing, CI/CD pipelines, and cloud infrastructure into one unified AI platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dezign 2 App | System Design as the Programming Language",
    description:
      "Transform PRDs and architecture topologies into production-ready full-stack microservices, tests, and cloud infrastructure.",
    creator: "@dezign2app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Dezign 2 App",
      url: baseUrl,
      logo: `${baseUrl}/favicon.ico`,
      description: "AI-Powered Software Engineering & System Design Platform.",
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "Dezign 2 App",
      description: "System Design as a Programming Language — AI-Powered Software Architecture & Monorepo Code Compilation.",
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Dezign 2 App",
      operatingSystem: "Web",
      applicationCategory: "DeveloperApplication",
      description:
        "An AI platform that treats system design as a programming language, compiling specifications, topologies, and schemas into full-stack code, load tests, and cloud deployments.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Dezign 2 App?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Dezign 2 App is an AI-powered software engineering platform that treats system design as a programming language. It transforms product requirements (PRDs), architecture topologies, and data schemas into production-ready full-stack monorepo code, microservices, automated load tests, and cloud infrastructure.",
          },
        },
        {
          "@type": "Question",
          name: "How does Dezign 2 App turn system design into full-stack code?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Dezign 2 App compiles visually designed software architecture graphs and PRD specifications into executable monorepos. Autonomous AI agents write frontends (Next.js, React), backend APIs (FastAPI, Node.js), message queues (Kafka), caching layers (Redis), database schemas (PostgreSQL), and infrastructure manifests (Docker, Kubernetes, Terraform).",
          },
        },
        {
          "@type": "Question",
          name: "What technologies does Dezign 2 App compile?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Dezign 2 App compiles Next.js, React, Node.js, Python FastAPI, Apache Kafka event streaming, Redis in-memory caching, PostgreSQL, Docker containers, and Kubernetes manifests.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ubuntu.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <PaywallModal>{children}</PaywallModal>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
