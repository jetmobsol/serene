import { useTagCorrelationQuery } from "@/lib/queries/analytics";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@repo/ui";
import { Tags } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 4) return "text-green-600 dark:text-green-400";
  if (score >= 3) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBadgeVariant(
  score: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 4) return "default";
  if (score >= 3) return "secondary";
  return "destructive";
}

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4"] as const;

export function TagCorrelation() {
  const { data, isLoading } = useTagCorrelationQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Insights</CardTitle>
        <CardDescription>
          How your activities correlate with your mood (tags with 3+ entries)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.correlations.length ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Tags className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No tag insights yet</p>
            <p className="text-sm">
              Add tags to your journal entries to discover mood patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.correlations.map((item) => (
              <div
                key={item.tag}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{item.tag}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.entryCount}{" "}
                    {item.entryCount === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${scoreColor(item.averageMoodScore)}`}
                  >
                    {item.averageMoodScore.toFixed(1)}
                  </span>
                  <Badge variant={scoreBadgeVariant(item.averageMoodScore)}>
                    {item.averageMoodScore >= 4
                      ? "Positive"
                      : item.averageMoodScore >= 3
                        ? "Neutral"
                        : "Low"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
