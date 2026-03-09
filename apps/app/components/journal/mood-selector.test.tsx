import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoodSelector } from "./mood-selector";

afterEach(cleanup);

describe("MoodSelector", () => {
  it("renders all 6 mood options", () => {
    render(<MoodSelector value={null} onChange={() => {}} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(6);

    expect(screen.getByLabelText("Happy")).toBeInTheDocument();
    expect(screen.getByLabelText("Calm")).toBeInTheDocument();
    expect(screen.getByLabelText("Anxious")).toBeInTheDocument();
    expect(screen.getByLabelText("Sad")).toBeInTheDocument();
    expect(screen.getByLabelText("Overwhelmed")).toBeInTheDocument();
    expect(screen.getByLabelText("Angry")).toBeInTheDocument();
  });

  it("has a radiogroup with aria-label", () => {
    render(<MoodSelector value={null} onChange={() => {}} />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "Select your mood",
    );
  });

  it("shows no mood selected initially when value is null", () => {
    render(<MoodSelector value={null} onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("aria-checked", "false");
    });
  });

  it("shows the correct mood as selected", () => {
    render(<MoodSelector value="Calm" onChange={() => {}} />);
    expect(screen.getByLabelText("Calm")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByLabelText("Happy")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("calls onChange with the mood when clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<MoodSelector value={null} onChange={handleChange} />);
    await user.click(screen.getByLabelText("Happy"));

    expect(handleChange).toHaveBeenCalledWith("Happy");
  });

  it("calls onChange with a different mood on second click", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<MoodSelector value="Happy" onChange={handleChange} />);
    await user.click(screen.getByLabelText("Sad"));

    expect(handleChange).toHaveBeenCalledWith("Sad");
  });

  it("navigates with arrow keys", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<MoodSelector value={null} onChange={handleChange} />);

    // Focus the first radio
    const firstRadio = screen.getByLabelText("Happy");
    firstRadio.focus();

    // Arrow right to next
    await user.keyboard("{ArrowRight}");
    expect(screen.getByLabelText("Calm")).toHaveFocus();

    // Arrow right again
    await user.keyboard("{ArrowRight}");
    expect(screen.getByLabelText("Anxious")).toHaveFocus();

    // Enter to select
    await user.keyboard("{Enter}");
    expect(handleChange).toHaveBeenCalledWith("Anxious");
  });

  it("wraps around on arrow key navigation", async () => {
    const user = userEvent.setup();

    render(<MoodSelector value={null} onChange={() => {}} />);

    // Focus the last radio
    const lastRadio = screen.getByLabelText("Angry");
    lastRadio.focus();

    // Arrow right should wrap to first
    await user.keyboard("{ArrowRight}");
    expect(screen.getByLabelText("Happy")).toHaveFocus();
  });

  it("selects with Space key", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<MoodSelector value={null} onChange={handleChange} />);

    const firstRadio = screen.getByLabelText("Happy");
    firstRadio.focus();

    await user.keyboard(" ");
    expect(handleChange).toHaveBeenCalledWith("Happy");
  });
});
