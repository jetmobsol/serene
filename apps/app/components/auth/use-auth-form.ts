import { auth } from "@/lib/auth";
import type { FormEvent } from "react";
import { useCallback, useRef, useState } from "react";

/** Trim and lowercase for consistent email matching across auth flows. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AuthStep = "password-form" | "email" | "otp";

// Minimal state machine for auth flow.
// "password-form" is the primary step showing email+password fields.
// "email" and "otp" are the alternative OTP flow (login only).
const VALID_TRANSITIONS: Record<AuthStep, AuthStep[]> = {
  "password-form": ["email"],
  email: ["password-form", "otp"],
  otp: ["email"],
};

interface UseAuthFormOptions {
  /**
   * Called after successful authentication. Caller is responsible for
   * cache invalidation and navigation. Awaited before form state resets.
   */
  onSuccess: () => Promise<void>;
  isExternallyLoading?: boolean;
  /**
   * UI mode affecting copy, available fields, and auth method.
   * "signup" shows name+email+password. "login" shows email+password with OTP alternative.
   */
  mode?: "login" | "signup";
}

export function useAuthForm({
  onSuccess,
  isExternallyLoading,
  mode = "login",
}: UseAuthFormOptions) {
  const [step, setStep] = useState<AuthStep>("password-form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  // Counter-based to handle overlapping child operations (e.g., rapid double-click)
  const [pendingOps, setPendingOps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Guards against concurrent auth completion (e.g., passkey conditional UI + manual click).
  // Reset when returning to password-form step to allow retry after navigation back.
  const hasSucceededRef = useRef(false);
  // Ref provides current step to memoized transitionTo callback (avoids stale closure)
  const stepRef = useRef(step);
  stepRef.current = step;

  // Track child loading via counter to correctly handle overlapping operations
  const setChildBusy = useCallback((busy: boolean) => {
    setPendingOps((c) => (busy ? c + 1 : Math.max(0, c - 1)));
  }, []);

  // Unified busy state: disables navigation and other auth methods while any flow is active
  const isDisabled = isLoading || pendingOps > 0 || !!isExternallyLoading;

  const onAuthSuccess = async () => {
    if (hasSucceededRef.current) return;
    hasSucceededRef.current = true;

    try {
      setIsLoading(true);
      await onSuccess();
    } catch (err) {
      console.error("Post-auth error:", err);
      setError("Something went wrong. Please try again.");
      hasSucceededRef.current = false; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  };

  // Validates transitions to prevent invalid step jumps.
  // Returning to "password-form" resets the success guard to allow fresh auth attempts.
  const transitionTo = useCallback((next: AuthStep, clearErr = true) => {
    const current = stepRef.current;
    if (!VALID_TRANSITIONS[current].includes(next)) {
      return;
    }
    if (next === "password-form") {
      hasSucceededRef.current = false;
    }
    setStep(next);
    if (clearErr) setError(null);
  }, []);

  const goToOtpFlow = () => transitionTo("email");
  const goToPasswordForm = () => transitionTo("password-form");
  // Go back to email step, preserving error message
  const resetToEmail = () => transitionTo("email", false);

  const sendOtp = async (e?: FormEvent) => {
    e?.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;
    setEmail(normalizedEmail);

    try {
      setIsLoading(true);
      setError(null);

      // "sign-in" type handles both login and signup (creates user if needed)
      const result = await auth.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "sign-in",
      });

      if (result.data) {
        // Dev-only: API returns OTP in response for automated QA
        const otp = (result.data as Record<string, unknown>)?.devOtp;
        if (typeof otp === "string") setDevOtp(otp);
        transitionTo("otp");
      } else if (result.error) {
        setError(result.error.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Email OTP error:", err);
      setError("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithPassword = async (e?: FormEvent) => {
    e?.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name.trim();
    if (!normalizedEmail || !password || password.length < 8) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await auth.signUp.email({
        name: trimmedName || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password,
      });

      if (result.data) {
        await onAuthSuccess();
      } else if (result.error) {
        const code = "code" in result.error ? result.error.code : undefined;
        if (code === "USER_ALREADY_EXISTS") {
          setError("Unable to create account. Please try logging in instead.");
        } else {
          setError(result.error.message || "Failed to create account");
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPassword = async (e?: FormEvent) => {
    e?.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await auth.signIn.email({
        email: normalizedEmail,
        password,
      });

      if (result.data) {
        await onAuthSuccess();
      } else if (result.error) {
        // Deliberately vague to prevent account enumeration
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Better Auth exposes this as a server endpoint, not a typed client method.
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          redirectTo: "/login",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset email");
      }

      // Always show success regardless of whether email exists (prevents enumeration)
      setForgotPasswordSent(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const changeEmail = (value: string) => {
    setEmail(value);
    if (forgotPasswordSent) setForgotPasswordSent(false);
  };

  const changePassword = (value: string) => {
    setPassword(value);
  };

  const changeName = (value: string) => {
    setName(value);
  };

  return {
    // State
    step,
    email,
    password,
    name,
    devOtp,
    isLoading,
    isDisabled,
    error,
    mode,
    forgotPasswordSent,

    // Actions
    changeEmail,
    changePassword,
    changeName,
    onAuthSuccess,
    setError,
    sendOtp,
    signUpWithPassword,
    signInWithPassword,
    handleForgotPassword,
    goToOtpFlow,
    goToPasswordForm,
    resetToEmail,
    setChildBusy,
  };
}
