import { trpcClient } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  weeklyMood: (weekStart: string) =>
    [...analyticsQueryKeys.all, "weeklyMood", weekStart] as const,
  moodTrend: (days: number) =>
    [...analyticsQueryKeys.all, "moodTrend", days] as const,
  tagCorrelation: () => [...analyticsQueryKeys.all, "tagCorrelation"] as const,
};

export function useWeeklyMoodQuery(weekStart: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.weeklyMood(weekStart),
    queryFn: () =>
      trpcClient.analytics.weeklyMoodDistribution.query({ weekStart }),
  });
}

export function useMoodTrendQuery(days: number = 30) {
  return useQuery({
    queryKey: analyticsQueryKeys.moodTrend(days),
    queryFn: () => trpcClient.analytics.moodTrend.query({ days }),
  });
}

export function useTagCorrelationQuery() {
  return useQuery({
    queryKey: analyticsQueryKeys.tagCorrelation(),
    queryFn: () => trpcClient.analytics.tagCorrelation.query(),
  });
}
