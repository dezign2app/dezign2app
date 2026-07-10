import { ChatCloser } from "../../_components/chat/chat-closer";

export default function WorkflowLayout({
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
