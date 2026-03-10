import { MoodBarChart } from "@/components/analytics/mood-bar-chart";
import { MoodTrendChart } from "@/components/analytics/mood-trend-chart";
import { TagCorrelation } from "@/components/analytics/tag-correlation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
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

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4">
          <MoodBarChart />
        </TabsContent>

        <TabsContent value="trend" className="mt-4">
          <MoodTrendChart />
        </TabsContent>

        <TabsContent value="tags" className="mt-4">
          <TagCorrelation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
