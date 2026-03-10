import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoodTrendChart } from "./mood-trend-chart";

vi.mock("@/lib/queries/analytics", () => ({
  useMoodTrendQuery: vi.fn().mockReturnValue({
    data: {
      trend: [
        {
          date: "2026-03-08",
          averageScore: 3.5,
          entryCount: 2,
          moods: { Happy: 1, Calm: 1 },
        },
        {
          date: "2026-03-09",
          averageScore: 4.0,
          entryCount: 1,
          moods: { Happy: 1 },
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MoodTrendChart", () => {
  it("renders the chart title", () => {
    render(<MoodTrendChart />, { wrapper: createWrapper() });
    expect(screen.getByText("Mood Trend")).toBeInTheDocument();
  });

  it("renders area chart when data exists", () => {
    render(<MoodTrendChart />, { wrapper: createWrapper() });
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("shows empty state when no trend data", async () => {
    const { useMoodTrendQuery } = await import("@/lib/queries/analytics");
    const mockQueryResult = {
      data: { trend: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useMoodTrendQuery>;
    vi.mocked(useMoodTrendQuery).mockReturnValue(mockQueryResult);

    render(<MoodTrendChart />, { wrapper: createWrapper() });
    expect(screen.getByText("No trend data yet")).toBeInTheDocument();
  });

  it("shows loading skeleton", async () => {
    const { useMoodTrendQuery } = await import("@/lib/queries/analytics");
    const mockQueryResult = {
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useMoodTrendQuery>;
    vi.mocked(useMoodTrendQuery).mockReturnValue(mockQueryResult);

    render(<MoodTrendChart />, { wrapper: createWrapper() });
    expect(document.querySelector(".h-\\[300px\\]")).toBeInTheDocument();
  });
});
