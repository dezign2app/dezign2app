import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { RootProvider } from "fumadocs-ui/provider/next";

import "./global.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Workflow Template Docs",
    template: "%s | Workflow Template Docs",
  },
  description: "Fumadocs-powered documentation for the Workflow Template monorepo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-fd-background text-fd-foreground antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
