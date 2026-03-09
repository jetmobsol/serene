import { BarChart3, BookHeart, Home, Settings } from "lucide-react";

export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: BookHeart, label: "Journal", to: "/journal" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;
