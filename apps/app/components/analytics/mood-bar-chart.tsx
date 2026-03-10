import { useWeeklyMoodQuery } from "@/lib/queries/analytics";
import { MOOD_COLORS, MOODS, type MoodType } from "@repo/core";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@repo/ui";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${weekStart.toLocaleDateString("en-US", opts)} - ${weekEnd.toLocaleDateString("en-US", opts)}`;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function MoodBarChart() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const { data, isLoading } = useWeeklyMoodQuery(toISODate(weekStart));

  const navigateWeek = (direction: -1 | 1) => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  };

  const isCurrentWeek =
    toISODate(getMonday(new Date())) === toISODate(weekStart);

  // Build chart data with all moods (zero-fill missing ones)
  const chartData = MOODS.map((mood) => ({
    mood,
    count: data?.distribution.find((d) => d.mood === mood)?.count ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Mood Distribution</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek(-1)}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[160px] text-center">
              {formatWeekLabel(weekStart)}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek(1)}
              disabled={isCurrentWeek}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : data?.totalEntries === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No entries this week</p>
            <p className="text-sm">
              Start journaling to see your mood distribution here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mood" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [value, "Entries"]}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.mood}
                    fill={
                      MOOD_COLORS[entry.mood as MoodType]?.light ??
                      "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
