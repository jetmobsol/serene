import { useCallback, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <Header
        isSidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main content — offset by fixed sidebar (lg) and fixed header */}
      <main className="lg:pl-64 pt-14 min-h-screen bg-background">
        <div className="h-full">{children}</div>
      </main>
    </>
  );
}
