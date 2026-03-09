import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteEntryDialog } from "./delete-entry-dialog";

afterEach(() => {
  cleanup();
});

describe("DeleteEntryDialog", () => {
  it("renders dialog content when open", () => {
    render(
      <DeleteEntryDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.getByText("Delete entry?")).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone/i),
    ).toBeInTheDocument();
  });

  it("does not render dialog content when closed", () => {
    render(
      <DeleteEntryDialog
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.queryByText("Delete entry?")).not.toBeInTheDocument();
  });

  it("calls onConfirm when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteEntryDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows loading state when isPending", () => {
    render(
      <DeleteEntryDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={true}
      />,
    );
    expect(screen.getByText("Deleting...")).toBeInTheDocument();
  });

  it("shows Delete text when not pending", () => {
    render(
      <DeleteEntryDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: /^delete$/i }),
    ).toBeInTheDocument();
  });
});
