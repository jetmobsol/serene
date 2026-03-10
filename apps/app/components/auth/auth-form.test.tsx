import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "./auth-form";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock auth client
vi.mock("@/lib/auth", () => ({
  auth: {
    signUp: {
      email: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    signIn: {
      email: vi.fn().mockResolvedValue({ data: null, error: null }),
      social: vi.fn().mockResolvedValue({ data: null, error: null }),
      passkey: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    emailOtp: {
      sendVerificationOtp: vi
        .fn()
        .mockResolvedValue({ data: null, error: null }),
    },
    forgetPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock auth-config
vi.mock("@/lib/auth-config", () => ({
  authConfig: {
    passkey: { enableConditionalUI: false },
    errors: {
      passkeyNotSupported: "Passkeys not supported",
      networkError: "Network error",
      genericError: "Something went wrong",
    },
  },
  getSafeRedirectUrl: (url: string) => url || "/",
}));

// Mock session queries
vi.mock("@/lib/queries/session", () => ({
  sessionQueryKey: ["session"],
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

const mockOnSuccess = vi.fn().mockResolvedValue(undefined);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AuthForm - Signup Mode", () => {
  it("renders name, email, and password fields", () => {
    render(<AuthForm mode="signup" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders submit button with 'Create account' text", () => {
    render(<AuthForm mode="signup" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("renders Google OAuth button", () => {
    render(<AuthForm mode="signup" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("renders link to login page", () => {
    render(<AuthForm mode="signup" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    const loginLink = screen.getByRole("link", { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("disables submit when password is less than 8 characters", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await user.type(emailInput, "test@test.com");
    await user.type(passwordInput, "short");

    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("shows inline password validation error on blur", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });

    const passwordInput = screen.getByLabelText("Password");
    await user.type(passwordInput, "short");
    await user.tab(); // blur

    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
  });
});

describe("AuthForm - Login Mode", () => {
  it("renders email and password fields", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("does not render name field", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });

  it("renders submit button with 'Sign in' text", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("renders Google OAuth button", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("renders email OTP alternative button", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.getByRole("button", { name: /email code/i }),
    ).toBeInTheDocument();
  });

  it("renders passkey login button", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.getByRole("button", { name: /passkey/i }),
    ).toBeInTheDocument();
  });

  it("renders forgot password link", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.getByRole("button", { name: /forgot password/i }),
    ).toBeInTheDocument();
  });

  it("renders link to signup page", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    const signupLink = screen.getByRole("link", { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute("href", "/signup");
  });
});

describe("AuthForm - Password Toggle", () => {
  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", {
      name: /show password/i,
    });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = screen.getByRole("button", {
      name: /hide password/i,
    });
    await user.click(hideButton);

    expect(passwordInput).toHaveAttribute("type", "password");
  });
});

describe("AuthForm - Error Display", () => {
  it("displays error messages with alert role", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.signIn.email).mockResolvedValueOnce({
      data: null,
      error: {
        message: "Invalid credentials",
        code: "INVALID_EMAIL_OR_PASSWORD",
      },
    } as never);

    const user = userEvent.setup();
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
  });
});
