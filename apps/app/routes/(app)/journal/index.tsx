import { Timeline } from "@/components/journal/timeline";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/journal/")({
  component: Journal,
});

function Journal() {
  const { user } = Route.useRouteContext();
  const firstName = user?.name?.split(" ")[0] ?? null;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-6 lg:py-10 space-y-6 lg:space-y-8">
      {/* Page header */}
      <div>
        <h1
          className="text-4xl lg:text-5xl text-foreground"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400,
          }}
        >
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h1>
        <p className="text-base text-muted-foreground mt-2">
          How are you feeling today?
        </p>
      </div>

      {/* Timeline section */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-6">
          Your Entries
        </p>
        <Timeline />
      </div>
    </div>
  );
}
