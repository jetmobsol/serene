import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AiResponse } from "./ai-response";

afterEach(() => {
  cleanup();
});

describe("AiResponse", () => {
  it("returns null when no response and not streaming", () => {
    const { container } = render(
      <AiResponse response={null} hasCrisisContent={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading indicator when streaming with no text yet", () => {
    render(
      <AiResponse
        response={null}
        hasCrisisContent={false}
        isStreaming={true}
        streamedText=""
      />,
    );
    expect(screen.getByText("Reflecting on your entry")).toBeInTheDocument();
  });

  it("shows streamed text while streaming", () => {
    render(
      <AiResponse
        response={null}
        hasCrisisContent={false}
        isStreaming={true}
        streamedText="Partial response"
      />,
    );
    expect(screen.getByText("Partial response")).toBeInTheDocument();
  });

  it("shows completed response when not streaming", () => {
    render(<AiResponse response="Full AI insight" hasCrisisContent={false} />);
    expect(screen.getByText("Full AI insight")).toBeInTheDocument();
  });

  it("truncates text in compact variant", () => {
    const longText = "A".repeat(150);
    render(
      <AiResponse
        response={longText}
        hasCrisisContent={false}
        variant="compact"
      />,
    );
    expect(screen.getByText("A".repeat(100) + "...")).toBeInTheDocument();
  });

  it("shows full text in full variant", () => {
    const longText = "A".repeat(150);
    render(
      <AiResponse
        response={longText}
        hasCrisisContent={false}
        variant="full"
      />,
    );
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("shows AI Insight header in full variant", () => {
    render(
      <AiResponse
        response="Some insight"
        hasCrisisContent={false}
        variant="full"
      />,
    );
    expect(screen.getByText("AI Insight")).toBeInTheDocument();
  });

  it("does not show AI Insight header in compact variant", () => {
    render(
      <AiResponse
        response="Some insight"
        hasCrisisContent={false}
        variant="compact"
      />,
    );
    expect(screen.queryByText("AI Insight")).not.toBeInTheDocument();
  });

  it("renders SafetyBanner when hasCrisisContent is true", () => {
    render(
      <AiResponse
        response="Response with crisis content"
        hasCrisisContent={true}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(/988 Suicide & Crisis Lifeline/),
    ).toBeInTheDocument();
  });

  it("does not render SafetyBanner when hasCrisisContent is false", () => {
    render(<AiResponse response="Normal response" hasCrisisContent={false} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has aria-live region for accessibility", () => {
    render(
      <AiResponse response="Accessible response" hasCrisisContent={false} />,
    );
    const textElement = screen.getByText("Accessible response");
    expect(textElement).toHaveAttribute("aria-live", "polite");
  });
});
