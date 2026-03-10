import { BarChart3, BookHeart } from "lucide-react";

export const sidebarItems = [
  { icon: BookHeart, label: "Journal", to: "/journal" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
] as const;
