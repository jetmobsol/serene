import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryForm } from "./entry-form";

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();

vi.mock("@/lib/queries/journal", () => ({
  useCreateJournalMutation: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
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

describe("EntryForm", () => {
  it("renders mood selector, tag chips, and note editor", () => {
    render(<EntryForm />, { wrapper: createWrapper() });
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/write about your day/i),
    ).toBeInTheDocument();
  });

  it("save button is disabled when no mood selected", () => {
    render(<EntryForm />, { wrapper: createWrapper() });
    const saveButton = screen.getByRole("button", { name: /save entry/i });
    expect(saveButton).toBeDisabled();
  });

  it("save button is enabled after selecting a mood", async () => {
    const user = userEvent.setup();
    render(<EntryForm />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText("Happy"));
    const saveButton = screen.getByRole("button", { name: /save entry/i });
    expect(saveButton).toBeEnabled();
  });

  it("calls create mutation on save", async () => {
    const user = userEvent.setup();
    render(<EntryForm />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText("Happy"));
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      { mood: "Happy", tags: [], note: "" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("shows 'Update Entry' in edit mode", () => {
    render(
      <EntryForm
        entryId="jrn_123"
        defaultValues={{ mood: "Calm", tags: ["Work"], note: "test note" }}
      />,
      { wrapper: createWrapper() },
    );
    expect(
      screen.getByRole("button", { name: /update entry/i }),
    ).toBeInTheDocument();
  });
});
