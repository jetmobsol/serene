import { signOut, useSessionQuery } from "@/lib/queries/session";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { DarkModeToggle } from "./dark-mode-toggle";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ isSidebarOpen, onMenuToggle }: HeaderProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSessionQuery();
  const user = session?.user;
  const initials = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <header
      className="
        fixed top-0 left-0 lg:left-64 right-0 h-14 z-30
        flex items-center justify-between px-4 lg:px-9
        bg-background/85 backdrop-blur-md border-b border-border/40
      "
    >
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5">
        <DarkModeToggle />

        {user && (
          <button
            onClick={() => signOut(queryClient)}
            className="rounded-full border border-border/50 px-3.5 py-1.5 text-xs
              font-medium text-muted-foreground
              hover:text-accent-foreground hover:border-accent-foreground/30
              hover:bg-accent transition-all"
          >
            Sign out
          </button>
        )}

        {user && (
          <div
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground
              flex items-center justify-center text-xs font-semibold shrink-0"
            title={user.name ?? user.email}
          >
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
