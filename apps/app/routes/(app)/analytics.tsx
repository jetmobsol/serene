import { MoodBarChart } from "@/components/analytics/mood-bar-chart";
import { useWeeklyMoodQuery } from "@/lib/queries/analytics";
import { getMonday } from "@/lib/utils/date-groups";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { MOOD_COLORS, MOOD_SCORES, MOODS, type MoodType } from "@repo/core";
import { Card, CardContent, Skeleton } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Smile, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/(app)/analytics")({
  component: Analytics,
});

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function Analytics() {
  const weekStart = getMonday(new Date());
  const { data, isLoading } = useWeeklyMoodQuery(toISODate(weekStart));

  const totalEntries = data?.totalEntries ?? 0;

  const dominantMood = data?.distribution.length
    ? data.distribution.reduce((max, d) => (d.count > max.count ? d : max))
    : null;

  const wellbeingScore =
    totalEntries > 0 && data?.distribution
      ? data.distribution.reduce(
          (sum, d) => sum + (MOOD_SCORES[d.mood as MoodType] ?? 0) * d.count,
          0,
        ) / totalEntries
      : null;

  const DominantIcon = dominantMood
    ? getMoodIcon(dominantMood.mood as MoodType)
    : null;

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Page header */}
      <div>
        <h2 className="text-3xl tracking-tight">Insights</h2>
        <p className="text-muted-foreground mt-1">
          Understand your mood patterns and discover what impacts your
          well-being.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-5 pb-4">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    This week
                  </p>
                  <p className="text-3xl font-light mt-1 tracking-tight font-[Cormorant_Garamond]">
                    {totalEntries}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalEntries === 1 ? "entry" : "entries"} recorded
                  </p>
                </div>
                <div className="rounded-full bg-secondary/60 p-2.5">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-5 pb-4">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : dominantMood ? (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Top mood
                  </p>
                  <p className="text-3xl font-light mt-1 tracking-tight font-[Cormorant_Garamond]">
                    {dominantMood.mood}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dominantMood.count}{" "}
                    {dominantMood.count === 1 ? "time" : "times"} this week
                  </p>
                </div>
                <div
                  className="rounded-full p-2.5"
                  style={{
                    backgroundColor:
                      MOOD_COLORS[dominantMood.mood as MoodType]?.light + "33",
                  }}
                >
                  {DominantIcon ? (
                    <DominantIcon className="h-4 w-4 text-foreground/70" />
                  ) : (
                    <Smile className="h-4 w-4 text-foreground/70" />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Top mood
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    No data yet
                  </p>
                </div>
                <div className="rounded-full bg-muted p-2.5">
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-5 pb-4">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : wellbeingScore !== null ? (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Well-being
                  </p>
                  <p className="text-3xl font-light mt-1 tracking-tight font-[Cormorant_Garamond]">
                    {wellbeingScore.toFixed(1)}
                    <span className="text-base text-muted-foreground">/5</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {wellbeingScore >= 4
                      ? "Thriving"
                      : wellbeingScore >= 3
                        ? "Balanced"
                        : wellbeingScore >= 2
                          ? "Mixed"
                          : "Challenging"}{" "}
                    week
                  </p>
                </div>
                <div className="rounded-full bg-secondary/60 p-2.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Well-being
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    No data yet
                  </p>
                </div>
                <div className="rounded-full bg-muted p-2.5">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main chart */}
      <MoodBarChart />

      {/* Mood breakdown mini-cards */}
      {!isLoading && totalEntries > 0 && (
        <div>
          <h3 className="text-lg mb-3 text-muted-foreground">Mood breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {MOODS.map((mood) => {
              const count =
                data?.distribution.find((d) => d.mood === mood)?.count ?? 0;
              const pct =
                totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
              const MoodIcon = getMoodIcon(mood);
              return (
                <Card key={mood} className="overflow-hidden">
                  <CardContent className="p-3 text-center">
                    <div
                      className="mx-auto rounded-full w-9 h-9 flex items-center justify-center mb-2"
                      style={{
                        backgroundColor: MOOD_COLORS[mood].light + "33",
                      }}
                    >
                      {MoodIcon && (
                        <MoodIcon className="h-4 w-4 text-foreground/70" />
                      )}
                    </div>
                    <p className="text-xs font-medium">{mood}</p>
                    <p className="text-lg font-light font-[Cormorant_Garamond] leading-tight mt-0.5">
                      {pct}%
                    </p>
                    <div className="w-full bg-muted rounded-full h-1 mt-1.5">
                      <div
                        className="h-1 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: MOOD_COLORS[mood].light,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
