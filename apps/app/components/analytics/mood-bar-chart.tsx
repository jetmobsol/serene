import { useWeeklyMoodQuery } from "@/lib/queries/analytics";
import { getMonday, toISODate } from "@/lib/utils/date-groups";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { MOOD_COLORS, MOODS, type MoodType } from "@repo/core";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Skeleton,
  type ChartConfig,
} from "@repo/ui";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${weekStart.toLocaleDateString("en-US", opts)} \u2013 ${weekEnd.toLocaleDateString("en-US", opts)}`;
}

const chartConfig = MOODS.reduce(
  (acc, mood) => {
    acc[mood] = {
      label: mood,
      theme: {
        light: MOOD_COLORS[mood].light,
        dark: MOOD_COLORS[mood].dark,
      },
    };
    return acc;
  },
  {} as Record<string, ChartConfig[string]>,
) satisfies ChartConfig;

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

  const chartData = MOODS.map((mood) => ({
    mood,
    count: data?.distribution.find((d) => d.mood === mood)?.count ?? 0,
    fill: `var(--color-${mood})`,
  }));

  const dominantMood = data?.distribution.length
    ? data.distribution.reduce((max, d) => (d.count > max.count ? d : max))
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Weekly Mood Distribution</CardTitle>
            {dominantMood && !isLoading && (
              <p className="text-sm text-muted-foreground mt-1">
                Most frequent:{" "}
                <span className="font-medium text-foreground">
                  {dominantMood.mood}
                </span>{" "}
                ({dominantMood.count}{" "}
                {dominantMood.count === 1 ? "entry" : "entries"})
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => navigateWeek(-1)}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[150px] text-center tabular-nums">
              {formatWeekLabel(weekStart)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => navigateWeek(1)}
              disabled={isCurrentWeek}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : data?.totalEntries === 0 ? (
          <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BarChart3 className="h-8 w-8" />
            </div>
            <p className="text-base font-medium">No entries this week</p>
            <p className="text-sm mt-1">
              Start journaling to see your mood patterns here.
            </p>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                />
                <XAxis
                  dataKey="mood"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={4}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                  content={
                    <ChartTooltipContent
                      nameKey="mood"
                      formatter={(value, name) => {
                        const IconComp = getMoodIcon(name as MoodType);
                        return (
                          <div className="flex items-center gap-2">
                            {IconComp && (
                              <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-muted-foreground">
                              {name}
                            </span>
                            <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                              {value}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.mood}
                      fill={
                        MOOD_COLORS[entry.mood as MoodType]?.light ??
                        "var(--primary)"
                      }
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* Mood legend with icons */}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-border/50">
              {MOODS.map((mood) => {
                const MoodIcon = getMoodIcon(mood);
                const count =
                  chartData.find((d) => d.mood === mood)?.count ?? 0;
                return (
                  <div
                    key={mood}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{
                        backgroundColor: MOOD_COLORS[mood].light,
                      }}
                    />
                    {MoodIcon && <MoodIcon className="h-3 w-3" />}
                    <span>
                      {mood}
                      {count > 0 && (
                        <span className="ml-1 font-medium text-foreground">
                          {count}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
