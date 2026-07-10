import React from "react";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { cookies } from "next/headers";
import { AuthenticatedProvider } from "@/providers";
import UpstashRealtimeProvider from "@/providers/upstash-realtime-provider";
import { Toaster } from "sonner";
import ProtectedSidebar from "./_components/sidebar";
import { ThemeProvider } from "next-themes";
import { ChatContainer } from "./_components/chat/chat-container";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  return (
    <UpstashRealtimeProvider>
      <AuthenticatedProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            <SidebarProvider defaultOpen={defaultOpen}>
              <ProtectedSidebar />
              <Toaster />
              <ChatContainer />
              <main className="flex flex-1 flex-col min-h-screen">{children}</main>
            </SidebarProvider>
        </ThemeProvider>
      </AuthenticatedProvider>
    </UpstashRealtimeProvider>    
  );
};

export default Layout;
