import { toggleDarkMode } from "@/components/layout/dark-mode-toggle";
import { helpDialogOpenAtom } from "@/components/layout/help-dialog";
import { newEntryDialogOpenAtom } from "@/components/journal/new-entry-dialog";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

/**
 * Global keyboard shortcuts. Only fires when no input/textarea is focused
 * and no dialog is open (to avoid conflicts with typing).
 */
export function useKeyboardShortcuts() {
  const setNewEntryOpen = useSetAtom(newEntryDialogOpenAtom);
  const setHelpOpen = useSetAtom(helpDialogOpenAtom);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Skip when typing in inputs or contenteditable
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Skip if any modifier key is held (allow browser/OS shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          setNewEntryOpen(true);
          break;
        case "d":
          e.preventDefault();
          toggleDarkMode();
          break;
        case "?":
          e.preventDefault();
          setHelpOpen(true);
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setNewEntryOpen, setHelpOpen]);
}
