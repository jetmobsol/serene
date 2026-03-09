import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SafetyBanner } from "./safety-banner";

afterEach(() => {
  cleanup();
});

describe("SafetyBanner", () => {
  it("renders with alert role", () => {
    render(<SafetyBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("displays 988 Suicide & Crisis Lifeline info", () => {
    render(<SafetyBanner />);
    expect(
      screen.getByText(/988 Suicide & Crisis Lifeline/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "988" })).toHaveAttribute(
      "href",
      "tel:988",
    );
  });

  it("displays Crisis Text Line info", () => {
    render(<SafetyBanner />);
    expect(screen.getByText(/Crisis Text Line/)).toBeInTheDocument();
    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "741741" })).toHaveAttribute(
      "href",
      "sms:741741",
    );
  });

  it("does not have a close or dismiss button", () => {
    render(<SafetyBanner />);
    expect(
      screen.queryByRole("button", { name: /close|dismiss/i }),
    ).not.toBeInTheDocument();
  });
});
