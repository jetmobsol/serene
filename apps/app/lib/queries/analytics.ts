import { trpcClient } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  weeklyMood: (weekStart: string) =>
    [...analyticsQueryKeys.all, "weeklyMood", weekStart] as const,
};

export function useWeeklyMoodQuery(weekStart: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.weeklyMood(weekStart),
    queryFn: () =>
      trpcClient.analytics.weeklyMoodDistribution.query({ weekStart }),
  });
}
