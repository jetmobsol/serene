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
    expect(screen.getByPlaceholderText(/write freely/i)).toBeInTheDocument();
  });

  it("shows character count for empty input", () => {
    render(<NoteEditor value="" onChange={() => {}} />);
    expect(
      screen.getByText(/0 \/ 50 characters to unlock AI insight/),
    ).toBeInTheDocument();
  });

  it("updates character count as user types", () => {
    const { rerender } = render(<NoteEditor value="" onChange={() => {}} />);

    rerender(<NoteEditor value="Hello" onChange={() => {}} />);

    expect(
      screen.getByText(/5 \/ 50 characters to unlock AI insight/),
    ).toBeInTheDocument();
  });

  it("shows AI insight indicator at 50+ characters", async () => {
    const longText = "a".repeat(50);
    render(<NoteEditor value={longText} onChange={() => {}} />);

    expect(
      screen.getByText(/AI insight will be generated after saving/),
    ).toBeInTheDocument();
  });

  it("shows green checkmark at threshold", () => {
    const longText = "a".repeat(50);
    const { container } = render(
      <NoteEditor value={longText} onChange={() => {}} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("debounces onChange calls", () => {
    const handleChange = vi.fn();
    render(<NoteEditor value="" onChange={handleChange} />);
    const textarea = screen.getByPlaceholderText(/write freely/i);

    fireEvent.change(textarea, { target: { value: "H" } });
    fireEvent.change(textarea, { target: { value: "Hi" } });

    expect(handleChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("Hi");
  });

  it("respects maxLength prop", () => {
    render(<NoteEditor value="" onChange={() => {}} maxLength={10} />);
    const textarea = screen.getByPlaceholderText(/write freely/i);
    expect(textarea).toHaveAttribute("maxLength", "10");
  });

  it("shows destructive color at maxLength", () => {
    render(
      <NoteEditor value={"a".repeat(51)} onChange={() => {}} maxLength={51} />,
    );
    const countText = screen.getByText(
      /AI insight will be generated after saving/,
    );
    expect(countText).toHaveClass("text-destructive");
  });
});
