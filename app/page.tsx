import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardContent } from "@/components/DashboardContent";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function Page() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <DashboardContent />
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
