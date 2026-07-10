import { ChatCloser } from "../_components/chat/chat-closer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ChatCloser />
      {children}
    </>
  );
}
