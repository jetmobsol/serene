import { useMoodTrendQuery } from "@/lib/queries/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@repo/ui";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      date: string;
      averageScore: number;
      entryCount: number;
    };
  }>;
}

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">
        {new Date(data.date + "T00:00:00").toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}
      </p>
      <p className="text-muted-foreground">
        Avg score: {data.averageScore.toFixed(1)} / 5
      </p>
      <p className="text-muted-foreground">
        {data.entryCount} {data.entryCount === 1 ? "entry" : "entries"}
      </p>
    </div>
  );
}

export function MoodTrendChart() {
  const { data, isLoading } = useMoodTrendQuery(30);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Trend</CardTitle>
        <CardDescription>
          Your average mood score over the past 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !data?.trend.length ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No trend data yet</p>
            <p className="text-sm">
              Journal for a few days to see your mood trend appear here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data.trend}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.85 0.10 220)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.85 0.10 220)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: string) =>
                  new Date(value + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => value.toString()}
              />
              <Tooltip content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="averageScore"
                stroke="oklch(0.65 0.10 220)"
                fill="url(#moodGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
