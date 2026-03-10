import { MoodBarChart } from "@/components/analytics/mood-bar-chart";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/analytics")({
  component: Analytics,
});

function Analytics() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Insights</h2>
        <p className="text-muted-foreground">
          Understand your mood patterns and discover what impacts your
          well-being.
        </p>
      </div>

      <MoodBarChart />
    </div>
  );
}
