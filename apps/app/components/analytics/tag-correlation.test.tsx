import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TagCorrelation } from "./tag-correlation";

vi.mock("@/lib/queries/analytics", () => ({
  useTagCorrelationQuery: vi.fn().mockReturnValue({
    data: {
      correlations: [
        { tag: "Nature", entryCount: 5, averageMoodScore: 4.2 },
        { tag: "Work", entryCount: 10, averageMoodScore: 2.8 },
        { tag: "Fitness", entryCount: 3, averageMoodScore: 3.5 },
      ],
    },
    isLoading: false,
  }),
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

describe("TagCorrelation", () => {
  it("renders the title", () => {
    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("Tag Insights")).toBeInTheDocument();
  });

  it("renders tag names", () => {
    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("Nature")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Fitness")).toBeInTheDocument();
  });

  it("renders entry counts", () => {
    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("5 entries")).toBeInTheDocument();
    expect(screen.getByText("10 entries")).toBeInTheDocument();
    expect(screen.getByText("3 entries")).toBeInTheDocument();
  });

  it("renders mood score badges", () => {
    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("Positive")).toBeInTheDocument(); // Nature 4.2
    expect(screen.getByText("Neutral")).toBeInTheDocument(); // Fitness 3.5
    expect(screen.getByText("Low")).toBeInTheDocument(); // Work 2.8
  });

  it("shows empty state when no correlations", async () => {
    const { useTagCorrelationQuery } = await import("@/lib/queries/analytics");
    vi.mocked(useTagCorrelationQuery).mockReturnValue({
      data: { correlations: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useTagCorrelationQuery>);

    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("No tag insights yet")).toBeInTheDocument();
  });
});
