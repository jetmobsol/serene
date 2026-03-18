import { helpDialogOpenAtom } from "@/components/layout/help-dialog";
import { newEntryDialogOpenAtom } from "@/components/journal/new-entry-dialog";
import { signOut, useSessionQuery } from "@/lib/queries/session";
import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { Github, HelpCircle, Menu, PenLine, X } from "lucide-react";
import { DarkModeToggle } from "./dark-mode-toggle";
import { FontSizeToggle } from "./font-size-toggle";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ isSidebarOpen, onMenuToggle }: HeaderProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSessionQuery();
  const setNewEntryOpen = useSetAtom(newEntryDialogOpenAtom);
  const setHelpOpen = useSetAtom(helpDialogOpenAtom);
  const user = session?.user;

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
        {user && (
          <button
            onClick={() => setNewEntryOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5
              text-xs font-medium text-primary-foreground
              hover:bg-primary/90 transition-all shadow-sm"
          >
            <PenLine className="h-3.5 w-3.5" />
            New Entry
          </button>
        )}

        <FontSizeToggle />

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

        <a
          href="https://github.com/jetmobsol/serene"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full border border-border/50
            flex items-center justify-center shrink-0
            text-muted-foreground hover:text-accent-foreground
            hover:border-accent-foreground/30 hover:bg-accent
            transition-all"
          aria-label="GitHub"
          title="GitHub"
        >
          <Github className="h-4 w-4" />
        </a>

        <button
          onClick={() => setHelpOpen(true)}
          className="w-8 h-8 rounded-full bg-primary text-primary-foreground
            flex items-center justify-center shrink-0
            hover:bg-primary/90 transition-all shadow-sm"
          aria-label="Help"
          title="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
