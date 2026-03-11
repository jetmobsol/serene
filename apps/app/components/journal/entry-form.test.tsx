import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryForm } from "./entry-form";

const mockUpdateMutate = vi.fn();

vi.mock("@/lib/queries/journal", () => ({
  useUpdateJournalMutation: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
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

describe("EntryForm (edit mode)", () => {
  const defaultProps = {
    entryId: "jrn_123",
    defaultValues: {
      mood: "Calm" as const,
      tags: ["Work" as const],
      note: "test note",
    },
  };

  it("shows 'Update Entry' button", () => {
    render(<EntryForm {...defaultProps} />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /update entry/i }),
    ).toBeInTheDocument();
  });

  it("pre-fills mood selection", () => {
    render(
      <EntryForm
        entryId="jrn_123"
        defaultValues={{ mood: "Happy", tags: [], note: "" }}
      />,
      { wrapper: createWrapper() },
    );
    const happyRadio = screen.getByLabelText("Happy");
    expect(happyRadio).toBeChecked();
  });

  it("pre-fills note text", () => {
    render(<EntryForm {...defaultProps} />, { wrapper: createWrapper() });
    const noteArea = screen.getByPlaceholderText(/write freely/i);
    expect(noteArea).toHaveValue("test note");
  });

  it("calls update mutation with entry id on save", async () => {
    const user = userEvent.setup();
    render(
      <EntryForm
        entryId="jrn_456"
        defaultValues={{ mood: "Happy", tags: ["Work"], note: "old note" }}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole("button", { name: /update entry/i }));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { id: "jrn_456", mood: "Happy", tags: ["Work"], note: "old note" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("allows changing mood and saves updated value", async () => {
    const user = userEvent.setup();
    render(
      <EntryForm
        entryId="jrn_789"
        defaultValues={{ mood: "Happy", tags: [], note: "" }}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByLabelText("Sad"));
    await user.click(screen.getByRole("button", { name: /update entry/i }));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "jrn_789", mood: "Sad" }),
      expect.any(Object),
    );
  });
});
