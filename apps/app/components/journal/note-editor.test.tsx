import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoteEditor } from "./note-editor";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("NoteEditor", () => {
  it("renders textarea with placeholder", () => {
    render(<NoteEditor value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/50 characters/i)).toBeInTheDocument();
  });

  it("shows character count for empty input", () => {
    render(<NoteEditor value="" onChange={() => {}} />);
    expect(screen.getByText(/0 \/ 50 min for AI insight/)).toBeInTheDocument();
  });

  it("updates character count as user types", () => {
    const { rerender } = render(<NoteEditor value="" onChange={() => {}} />);

    // Re-render with updated value
    rerender(<NoteEditor value="Hello" onChange={() => {}} />);

    expect(screen.getByText(/5 \/ 50 min for AI insight/)).toBeInTheDocument();
  });

  it("shows AI insight indicator at 50+ characters", async () => {
    const longText = "a".repeat(50);
    render(<NoteEditor value={longText} onChange={() => {}} />);

    expect(
      screen.getByText(/50 \/ AI insight will be generated/),
    ).toBeInTheDocument();
  });

  it("shows green checkmark at threshold", () => {
    const longText = "a".repeat(50);
    const { container } = render(
      <NoteEditor value={longText} onChange={() => {}} />,
    );
    // CheckCircle2 icon renders as svg
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("debounces onChange calls", () => {
    const handleChange = vi.fn();
    render(<NoteEditor value="" onChange={handleChange} />);
    const textarea = screen.getByPlaceholderText(/50 characters/i);

    // Two rapid changes — each resets the 300ms debounce timer
    fireEvent.change(textarea, { target: { value: "H" } });
    fireEvent.change(textarea, { target: { value: "Hi" } });

    // Not called yet — debounce is still pending
    expect(handleChange).not.toHaveBeenCalled();

    // Advance past the debounce window — only the last value fires
    vi.advanceTimersByTime(300);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("Hi");
  });

  it("respects maxLength prop", () => {
    render(<NoteEditor value="" onChange={() => {}} maxLength={10} />);
    const textarea = screen.getByPlaceholderText(/50 characters/i);
    expect(textarea).toHaveAttribute("maxLength", "10");
  });

  it("shows destructive color at maxLength", () => {
    // Use maxLength > AI_INSIGHT_THRESHOLD so both atLimit and meetsThreshold
    // are true — the count span shows the "meets threshold" text and is styled
    // as destructive, making the intent of each condition unambiguous.
    render(
      <NoteEditor value={"a".repeat(51)} onChange={() => {}} maxLength={51} />,
    );
    const countText = screen.getByText(/51 \/ AI insight will be generated/);
    expect(countText).toHaveClass("text-destructive");
  });
});
