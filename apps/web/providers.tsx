"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import {
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(convexUrl);

import { Toaster } from "@workspace/ui/components/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkProvider appearance={{ theme: shadcn }}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <NuqsAdapter>
            {children}
            <Toaster />
          </NuqsAdapter>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </NextThemesProvider>
  );
}

export const AuthenticatedProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <Authenticated>{children}</Authenticated>;
};
export const UnauthenticatedProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <Unauthenticated>{children}</Unauthenticated>;
};
