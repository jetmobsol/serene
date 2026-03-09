import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryCard, type JournalEntryWithAi } from "./entry-card";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

vi.mock("@/lib/utils/relative-time", () => ({
  formatRelativeTime: () => "2 hours ago",
}));

vi.mock("@/lib/utils/mood-icons", () => ({
  getMoodIcon: () => {
    const Icon = (props: Record<string, unknown>) => (
      <svg data-testid="mood-icon" {...props} />
    );
    return Icon;
  },
}));

afterEach(() => {
  cleanup();
});

function makeEntry(
  overrides: Partial<JournalEntryWithAi> = {},
): JournalEntryWithAi {
  return {
    id: "jrn_test-1",
    mood: "Happy",
    tags: ["Work", "Fitness"],
    note: "Feeling great today",
    createdAt: new Date("2026-03-09T12:00:00Z"),
    updatedAt: new Date("2026-03-09T12:00:00Z"),
    aiResponse: null,
    ...overrides,
  };
}

describe("EntryCard", () => {
  it("renders mood label", () => {
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Happy")).toBeInTheDocument();
  });

  it("renders relative timestamp", () => {
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  it("renders tags as badges", () => {
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Fitness")).toBeInTheDocument();
  });

  it("renders truncated note preview", () => {
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Feeling great today")).toBeInTheDocument();
  });

  it("truncates long notes at 150 characters", () => {
    const longNote = "A".repeat(200);
    render(
      <EntryCard
        entry={makeEntry({ note: longNote })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("A".repeat(150) + "...")).toBeInTheDocument();
  });

  it("calls onEdit when Edit menu item is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <EntryCard entry={makeEntry()} onEdit={onEdit} onDelete={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /entry actions/i }));
    await user.click(screen.getByText("Edit"));

    expect(onEdit).toHaveBeenCalledWith("jrn_test-1");
  });

  it("calls onDelete when Delete menu item is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole("button", { name: /entry actions/i }));
    await user.click(screen.getByText("Delete"));

    expect(onDelete).toHaveBeenCalledWith("jrn_test-1");
  });

  it("renders AI response preview when present", () => {
    render(
      <EntryCard
        entry={makeEntry({
          aiResponse: {
            id: "air_1",
            response: "You seem happy today!",
            hasCrisisContent: false,
          },
        })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("You seem happy today!")).toBeInTheDocument();
  });

  it("does not render note section when note is null", () => {
    render(
      <EntryCard
        entry={makeEntry({ note: null })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText("Feeling great today")).not.toBeInTheDocument();
  });
});
