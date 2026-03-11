import { atom } from "jotai";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const darkModeAtom = atom(localStorage.getItem("theme") === "dark");

export function toggleDarkMode() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
}

export function DarkModeToggle() {
  const [dark, setDark] = useState<boolean | null>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    if (dark !== null) {
      document.documentElement.classList.toggle("dark", dark);
    }
  }, [dark]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (dark === null) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-muted transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
