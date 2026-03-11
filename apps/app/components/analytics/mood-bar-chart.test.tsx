import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoodBarChart } from "./mood-bar-chart";

vi.mock("@/lib/queries/analytics", () => ({
  useWeeklyMoodQuery: vi.fn().mockReturnValue({
    data: {
      distribution: [
        { mood: "Happy", count: 3 },
        { mood: "Calm", count: 2 },
      ],
      totalEntries: 5,
    },
    isLoading: false,
  }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

vi.mock("@repo/ui", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    ChartContainer: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <div data-testid="chart-container" className={className}>
        {children}
      </div>
    ),
    ChartTooltip: () => <div data-testid="chart-tooltip" />,
    ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
  };
});

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

describe("MoodBarChart", () => {
  it("renders the chart title", () => {
    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByText("Weekly Mood Distribution")).toBeInTheDocument();
  });

  it("renders week navigation arrows", () => {
    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByLabelText("Previous week")).toBeInTheDocument();
    expect(screen.getByLabelText("Next week")).toBeInTheDocument();
  });

  it("disables next week button when on current week", () => {
    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByLabelText("Next week")).toBeDisabled();
  });

  it("renders bar chart when data exists", () => {
    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("shows empty state when totalEntries is 0", async () => {
    const { useWeeklyMoodQuery } = await import("@/lib/queries/analytics");
    vi.mocked(useWeeklyMoodQuery).mockReturnValue({
      data: { distribution: [], totalEntries: 0 },
      isLoading: false,
    } as unknown as ReturnType<typeof useWeeklyMoodQuery>);

    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByText("No entries this week")).toBeInTheDocument();
  });

  it("navigates to previous week on click", async () => {
    const user = userEvent.setup();
    render(<MoodBarChart />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText("Previous week"));
    // After navigating back, next week button should be enabled
    expect(screen.getByLabelText("Next week")).toBeEnabled();
  });
});
