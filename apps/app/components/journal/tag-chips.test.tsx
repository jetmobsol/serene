import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TagChips } from "./tag-chips";

afterEach(cleanup);

describe("TagChips", () => {
  it("renders all 8 tag buttons", () => {
    render(<TagChips value={[]} onChange={() => {}} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(8);

    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Sleep")).toBeInTheDocument();
    expect(screen.getByText("Relationships")).toBeInTheDocument();
    expect(screen.getByText("Fitness")).toBeInTheDocument();
    expect(screen.getByText("Hobbies")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Nature")).toBeInTheDocument();
  });

  it("has a group with aria-label", () => {
    render(<TagChips value={[]} onChange={() => {}} />);
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Select tags",
    );
  });

  it("shows no tags selected initially", () => {
    render(<TagChips value={[]} onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("shows selected tags with aria-pressed true", () => {
    render(<TagChips value={["Work", "Fitness"]} onChange={() => {}} />);
    expect(screen.getByText("Work").closest("button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Fitness").closest("button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Sleep").closest("button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onChange with tag added when clicking unselected tag", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TagChips value={[]} onChange={handleChange} />);
    await user.click(screen.getByText("Work"));

    expect(handleChange).toHaveBeenCalledWith(["Work"]);
  });

  it("calls onChange with tag removed when clicking selected tag", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TagChips value={["Work", "Fitness"]} onChange={handleChange} />);
    await user.click(screen.getByText("Work"));

    expect(handleChange).toHaveBeenCalledWith(["Fitness"]);
  });

  it("supports multi-select (adds to existing selection)", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TagChips value={["Work"]} onChange={handleChange} />);
    await user.click(screen.getByText("Fitness"));

    expect(handleChange).toHaveBeenCalledWith(["Work", "Fitness"]);
  });
});
