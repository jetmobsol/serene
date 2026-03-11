import { sidebarItems } from "./constants";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40
          bg-sidebar border-r border-sidebar-border flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-7 py-6 mb-2">
          <span
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-2xl font-medium tracking-widest text-primary"
          >
            Serene
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-accent-foreground ml-0.5 align-super"
              aria-hidden="true"
            />
          </span>
        </div>

        <SidebarNav items={sidebarItems} />
      </aside>
    </>
  );
}
