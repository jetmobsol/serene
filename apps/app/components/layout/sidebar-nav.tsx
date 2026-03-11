import type { FileRoutesByTo } from "@/lib/routeTree.gen";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
  to: keyof FileRoutesByTo;
}

interface SidebarNavProps {
  items: readonly SidebarNavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  return (
    <nav className="flex-1 px-0 py-2">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="flex items-center gap-3 px-7 py-3 text-sm border-l-[3px] border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          activeProps={{
            className: "border-primary bg-secondary text-primary font-medium",
          }}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
