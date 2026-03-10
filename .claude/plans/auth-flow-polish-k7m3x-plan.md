# Auth Flow Polish (Deliverable #11) - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-10

## Summary

Polish the signup and login pages to meet PRD acceptance criteria (US-LP-002, US-LP-003). The existing auth infrastructure (Better Auth with email OTP, passkey, Google OAuth, email/password) is fully functional. This deliverable adds a password field with show/hide toggle to the signup form, adds email/password sign-in to the login form, adds inline validation, adds a "Forgot password" link, and writes Bowser QA YAML. The current auth form uses a multi-step flow (method selection -> email -> OTP); we extend it to support a direct email+password path for both signup and login while preserving all existing OTP and passkey flows.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `apps/app/components/auth/auth-form.tsx`
- `apps/app/components/auth/use-auth-form.ts`

### Files to Create

- `ai_review/user_stories/auth-flow.yaml`
- `apps/app/components/auth/password-input.tsx`
- `apps/app/components/auth/auth-form.test.tsx`

---

## Code Context

### Existing Auth Architecture

- **`apps/app/routes/(auth)/login.tsx`** (lines 1-73): Login page route. Uses `AuthForm mode="login"`. Has `beforeLoad` guard that redirects authenticated users. `handleSuccess` calls `revalidateSession` then navigates to `search.returnTo ?? "/"`.
- **`apps/app/routes/(auth)/signup.tsx`** (lines 1-73): Signup page route. Identical structure to login, uses `AuthForm mode="signup"`.
- **`apps/app/routes/(app)/route.tsx`** (lines 1-37): Protected route layout with `beforeLoad` auth guard. Redirects unauthenticated users to `/login?returnTo=...`.
- **`apps/app/routes/(app)/index.tsx`** (lines 1-7): Dashboard index redirects to `/journal`.
- **`apps/app/components/auth/auth-form.tsx`** (lines 1-357): Main auth form component with 3-step flow: `MethodSelection` -> `EmailInput` -> `OtpStep`. Contains `AuthForm`, `MethodSelection`, `EmailInput`, `OtpStep`, and `SignupTerms` sub-components. Login/signup links already present (lines 216-238).
- **`apps/app/components/auth/use-auth-form.ts`** (lines 1-153): State machine hook with steps: `method | email | otp`. Valid transitions: `method->email`, `email->method`, `email->otp`, `otp->email`. Manages `sendOtp` flow, loading states, error states.
- **`apps/app/components/auth/google-login.tsx`** (lines 1-86): Google OAuth button. Uses `auth.signIn.social({ provider: "google" })`.
- **`apps/app/components/auth/passkey-login.tsx`** (lines 1-119): Passkey login button with conditional UI support. Uses `auth.signIn.passkey()`.
- **`apps/app/components/auth/otp-verification.tsx`** (lines 1-167): OTP input with auto-submit for dev, resend cooldown.
- **`apps/app/lib/auth.ts`** (lines 1-41): Better Auth client. Includes `emailOTPClient()` plugin. No password-specific client plugin needed — `emailAndPassword` is built-in to Better Auth core client.
- **`apps/api/lib/auth.ts`** (lines 157-163): Server config has `emailAndPassword: { enabled: true }` with `sendResetPassword` handler.

### Key Better Auth Client API (built-in, no plugin needed)

- `auth.signUp.email({ name, email, password })` — Create account with email/password
- `auth.signIn.email({ email, password })` — Sign in with email/password
- `auth.forgetPassword({ email, redirectTo })` — Send password reset email
- `auth.resetPassword({ newPassword })` — Reset password (from reset link)

### Patterns to Follow

- **Test pattern**: `apps/app/components/journal/entry-form.test.tsx` — Uses `@testing-library/react` + `userEvent`, `QueryClientProvider` wrapper, `vi.mock` for dependencies, `afterEach` cleanup.
- **Component pattern**: Named exports, functional components, props interfaces with JSDoc.
- **Styling**: Tailwind CSS v4, shadcn/ui components from `@repo/ui`, Serene calm palette (sage green primary, warm ivory background, lavender accents).
- **Imports**: `@repo/ui` for `Button`, `Input`, `Label`; `lucide-react` for icons; `@tanstack/react-router` for `Link`.

### UI Components Available

- `Input` from `@repo/ui` — Standard input, supports `type`, `className`, all HTML input props.
- `Button` from `@repo/ui` — Supports `variant`, `disabled`, `type`.
- `Label` from `@repo/ui` — Form labels.
- No existing `PasswordInput` component — must create one.

---

## External Context

### Better Auth Email/Password API

**Sign Up** (`auth.signUp.email`):

```typescript
const result = await auth.signUp.email({
  name: string,
  email: string,
  password: string, // min 8 chars enforced server-side
});
// result.data: { user, session } on success
// result.error: { message, code } on failure (e.g., USER_ALREADY_EXISTS)
```

**Sign In** (`auth.signIn.email`):

```typescript
const result = await auth.signIn.email({
  email: string,
  password: string,
});
// result.data: { user, session } on success
// result.error: { message, code } on failure (e.g., INVALID_EMAIL_OR_PASSWORD)
```

**Forget Password** (`auth.forgetPassword`):

```typescript
const result = await auth.forgetPassword({
  email: string,
  redirectTo: string, // URL to redirect after reset
});
// Sends reset email, returns success regardless of whether email exists (prevents enumeration)
```

### Better Auth Error Codes (relevant)

- `USER_ALREADY_EXISTS` — Signup with existing email
- `INVALID_EMAIL_OR_PASSWORD` — Login with wrong credentials (deliberately vague to prevent enumeration)

---

## Architectural Narrative

### Task

Polish signup and login pages to satisfy US-LP-002 and US-LP-003 acceptance criteria. Add password fields, show/hide toggle, inline validation, forgot password link, and ensure all auth methods are visible. Write Bowser QA YAML for automated visual verification.

### Architecture

The auth form (`auth-form.tsx`) uses a step-based state machine (`use-auth-form.ts`) with three steps: `method`, `email`, `otp`. The `MethodSelection` step shows Google OAuth, email OTP, and passkey buttons. The `EmailInput` step collects email for OTP. The `OtpStep` verifies the OTP code. The form operates in `login` or `signup` mode, which affects copy and available methods.

### Selected Context

- `auth-form.tsx:88-154` — Main form rendering with step switching
- `auth-form.tsx:168-241` — MethodSelection with Google, email, passkey buttons and login/signup links
- `auth-form.tsx:253-301` — EmailInput step (email-only, no password)
- `use-auth-form.ts:11-15` — Valid transitions: `method->email`, `email->method|otp`, `otp->email`
- `use-auth-form.ts:95-127` — `sendOtp` function that transitions to OTP step

### Relationships

- `AuthForm` consumes `useAuthForm` hook for state management
- `MethodSelection` renders `GoogleLogin` and `PasskeyLogin` child components
- `EmailInput` feeds into `OtpStep` via the `sendOtp` action
- Route files (`login.tsx`, `signup.tsx`) render `AuthForm` with `mode` prop and `onSuccess` callback

### Implementation Notes

1. **Password field addition**: The PRD requires email+password signup (US-LP-002 AC-1) and email/password login (US-LP-003 AC-1). The current flow is passwordless OTP-only for email auth. We need to add password as an alternative path alongside OTP, not replace OTP.

2. **Form restructuring strategy**: Instead of the current "click email -> enter email -> OTP" flow, the signup form should show email+password fields directly on the method selection step. For login, show email+password fields directly, with OTP as an alternative ("Use email code instead"). This is a simpler, more conventional UX.

3. **No account existence leakage** (US-LP-003 AC-5): Better Auth's `INVALID_EMAIL_OR_PASSWORD` error is already vague. For signup, `USER_ALREADY_EXISTS` must be translated to a non-revealing message like "Unable to create account. Try logging in instead."

4. **Password show/hide toggle** (US-LP-002 AC-7): Create a `PasswordInput` component wrapping `Input` with an eye icon toggle button.

5. **Forgot password link** (US-LP-003 AC-7): Add below the password field on login. Uses `auth.forgetPassword({ email, redirectTo: "/login" })`.

6. **Name field**: US-LP-002 AC-1 requires name field on signup. Better Auth `signUp.email` accepts `name` parameter.

7. **Inline validation**: Email format check, password minimum 8 chars. Use HTML5 validation attributes plus state-based error display.

### Ambiguities

1. **OTP vs password flow**: The PRD says signup should accept "email/password OR Google OAuth" and login should support "email/password, Google OAuth, email OTP, passkey." Decision: Signup uses email+password as primary, with Google OAuth button. Login shows email+password as primary, with Google, OTP, and passkey as alternatives. The OTP flow is preserved but moved to a "Use email code instead" link.

2. **Name field**: The existing Better Auth user table has a `name` field. Signup form will add it. The current OTP flow auto-creates users without names; this is fine for OTP-only signups.

### Requirements

From US-LP-002 (Signup):

- [R1] Sign-up form accepts name, email, and password (minimum 8 characters)
- [R2] Google OAuth sign-up button is available and functional
- [R3] Email OTP verification is sent after email/password sign-up
- [R4] Upon successful sign-up, user is redirected to the journal dashboard
- [R5] Duplicate email addresses produce a clear error message (no enumeration)
- [R6] Form validation errors are displayed inline next to relevant fields
- [R7] Password field includes show/hide toggle

From US-LP-003 (Login):

- [R8] Login form accepts email and password
- [R9] Google OAuth login button is available
- [R10] Email OTP login is available
- [R11] Passkey authentication is available
- [R12] Failed login attempts produce clear error messages without revealing account existence
- [R13] After login, user is redirected to returnTo parameter or journal dashboard
- [R14] "Forgot password" link sends password reset email

Cross-cutting:

- [R15] Login <-> signup links work
- [R16] Unauthenticated users redirected to login
- [R17] Post-login redirect to journal dashboard

### Constraints

- Must not break existing OTP, Google OAuth, or passkey flows
- Better Auth client is already configured — no server changes needed
- Must use `@repo/ui` components (shadcn/ui new-york style)
- Must follow Serene calm aesthetic (sage green, warm ivory, lavender accents)
- Tailwind CSS v4
- React 19

### Selected Approach

**Approach**: Restructure auth form to show email+password fields directly on the first step, with alternative auth methods below.

**Description**: The current 3-step flow (method -> email -> OTP) is replaced with a new flow:

- **Signup**: Shows name, email, password fields with submit button, Google OAuth button, and link to login. No step-based navigation — it's a single form.
- **Login**: Shows email, password fields with submit button, "Forgot password" link, Google OAuth button, "Use email code instead" link (goes to OTP flow), passkey button, and link to signup.
- The `useAuthForm` hook gains new steps: `password-form` (the new primary step) and retains `email`, `otp` for the OTP alternative flow.
- The `MethodSelection` component is reworked to be the `PasswordForm` (signup: name+email+password; login: email+password) with alternative methods below.
- The OTP flow path is preserved: login users can click "Use email code instead" to go through the existing email->OTP steps.

**Rationale**: This matches conventional auth UX (like most SaaS products), satisfies all PRD requirements, and keeps the codebase change minimal. The existing OTP infrastructure is reused for the alternative login path.

**Trade-offs Accepted**: The signup form no longer offers an OTP-only path (users must set a password). This is acceptable because the PRD explicitly requires password-based signup (US-LP-002 AC-1). OTP remains available for login.

---

## Implementation Plan

### ai_review/user_stories/auth-flow.yaml [create]

**Purpose**: Bowser QA YAML file for automated visual testing of the auth flow polish. Must be created FIRST per the deliverable pipeline.
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create file with 4 stories covering signup validation, login auth methods, login<->signup links, and unauthenticated redirect.

**Implementation Details**:

- YAML format matching existing files in `ai_review/user_stories/`
- Stories cover all bowser-testable acceptance criteria from US-LP-002 and US-LP-003
- URLs point to `http://localhost:5173`

**Reference Implementation**:

```yaml
stories:
  - name: "Signup form validates inputs"
    url: "http://localhost:5173/signup"
    workflow: |
      Navigate to http://localhost:5173/signup
      Verify the signup form is visible
      Verify a name input field exists
      Verify an email input field exists
      Verify a password input field exists
      Verify a submit button exists
      Verify a Google OAuth or social login button is present
      Try to submit the form with empty fields
      Verify validation errors are displayed

  - name: "Login form has all auth methods"
    url: "http://localhost:5173/login"
    workflow: |
      Navigate to http://localhost:5173/login
      Verify the login form is visible
      Verify an email input field exists
      Verify a password input field exists
      Verify a Google OAuth login button is present
      Verify a submit button exists
      Verify a link or button for email OTP login exists
      Verify a passkey login button exists

  - name: "Login and signup pages link to each other"
    url: "http://localhost:5173/login"
    workflow: |
      Navigate to http://localhost:5173/login
      Verify a link to the signup page exists
      Click the link to signup
      Verify the URL changes to /signup
      Verify the signup form is visible
      Verify a link to the login page exists on the signup page
      Click the link to login
      Verify the URL changes to /login

  - name: "Unauthenticated user redirected to login"
    url: "http://localhost:5173/"
    workflow: |
      Navigate to http://localhost:5173/
      Verify the page redirects to the login page
      Verify the URL contains /login
```

**Dependencies**: None
**Provides**: Bowser YAML test definitions for `/ui-review auth-flow`

---

### apps/app/components/auth/password-input.tsx [create]

**Purpose**: Reusable password input component with show/hide toggle. Satisfies US-LP-002 AC-7 (password show/hide toggle).
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create `PasswordInput` component wrapping `Input` from `@repo/ui` with an eye/eye-off toggle button.

**Implementation Details**:

- Component signature: `PasswordInput(props: PasswordInputProps): React.ReactElement`
- Props extend `React.ComponentProps<"input">` (minus `type` which is controlled internally)
- Uses `Eye` and `EyeOff` icons from `lucide-react`
- Toggle button is `type="button"` to prevent form submission
- Uses `aria-label` for accessibility ("Show password" / "Hide password")
- Uses a wrapper `div` with `relative` positioning; toggle button absolutely positioned on the right

**Reference Implementation**:

```tsx
import { Input } from "@repo/ui";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={className}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
```

**Dependencies**: None (uses only `@repo/ui` and `lucide-react`)
**Provides**: `PasswordInput` component for use in `auth-form.tsx`

---

### apps/app/components/auth/use-auth-form.ts [edit]

**Purpose**: Extend the auth form state machine to support password-based auth flows alongside OTP.
**TOTAL CHANGES**: 5

**Changes**:

1. Lines 5-6: Add `"password-form"` to `AuthStep` type
2. Lines 11-15: Update `VALID_TRANSITIONS` to include `password-form` step
3. Lines 17-29: Add `name` and `password` state fields to `UseAuthFormOptions` return type
4. Lines 36-42: Add `name`, `password` state variables and `signUpWithPassword`, `signInWithPassword`, `forgotPassword` actions
5. Lines 95-127: Add `signUpWithPassword`, `signInWithPassword`, `forgotPassword` async functions

**Implementation Details**:

- New step `"password-form"` is the initial step (replaces `"method"` as default)
- `VALID_TRANSITIONS` updated: `"password-form"` can go to `"email"` (for OTP alternative) and `"method"` is removed
- On login mode, a new `goToOtpFlow` action transitions from `"password-form"` to `"email"` step
- `signUpWithPassword(e?: FormEvent)` calls `auth.signUp.email({ name, email, password })`, then calls `onAuthSuccess`
- `signInWithPassword(e?: FormEvent)` calls `auth.signIn.email({ email, password })`, then calls `onAuthSuccess`
- `forgotPassword()` calls `auth.forgetPassword({ email, redirectTo: "/login" })`, shows success message
- Error handling: translates `USER_ALREADY_EXISTS` to "Unable to create account. Please try logging in instead." to avoid enumeration

**Reference Implementation**:

```typescript
import { auth } from "@/lib/auth";
import type { FormEvent } from "react";
import { useCallback, useRef, useState } from "react";

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

    // Normalize before auth calls to prevent case/whitespace mismatches
    const normalizedEmail = email.trim().toLowerCase();
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

    const normalizedEmail = email.trim().toLowerCase();
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

    const normalizedEmail = email.trim().toLowerCase();
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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await auth.forgetPassword({
        email: normalizedEmail,
        redirectTo: "/login",
      });

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
```

**Dependencies**: `apps/app/lib/auth.ts` (existing, unchanged)
**Provides**: Extended `useAuthForm` hook with `password`, `name`, `signUpWithPassword`, `signInWithPassword`, `handleForgotPassword`, `goToOtpFlow`, `goToPasswordForm`, `forgotPasswordSent`

---

### apps/app/components/auth/auth-form.tsx [edit]

**Purpose**: Restructure the auth form UI to show email+password fields directly, with alternative auth methods. Satisfies all UI requirements from US-LP-002 and US-LP-003.
**TOTAL CHANGES**: 4

**Changes**:

1. Lines 1-8: Update imports — add `PasswordInput`, `Label` from `@repo/ui`, remove `ArrowLeft` and `Mail` (no longer needed for method selection step)
2. Lines 45-154: Replace `AuthForm` component body — new step rendering: `password-form` (primary), `email` (OTP alternative), `otp` (OTP verification)
3. Lines 157-241: Replace `MethodSelection` with `PasswordForm` — shows name+email+password fields with Google OAuth and alternative auth methods
4. Lines 243-357: Update `EmailInput` and `OtpStep` — adjust back navigation to go to `password-form` instead of `method`

**Implementation Details**:

- `PasswordForm` (replaces `MethodSelection`):
  - Signup mode: name field, email field, password field (with `PasswordInput`), submit button ("Create account"), Google OAuth button, link to login
  - Login mode: email field, password field (with `PasswordInput`), submit button ("Sign in"), forgot password link, Google OAuth button, "Use email code instead" link, passkey button, link to signup
- `EmailInput` step: back button goes to `password-form` via `goToPasswordForm`
- `OtpStep` step: back button goes to `email` step (unchanged behavior)
- Inline validation: password field shows error if < 8 chars on blur, email field uses HTML5 `required` + `type="email"`
- Separator between password form and OAuth ("or continue with")
- All form elements have proper `id`, `name`, `autoComplete` attributes for browser autofill

**Reference Implementation**:

```tsx
import { Button, Input, Label, cn } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import type { ComponentProps, FormEvent } from "react";
import { useState } from "react";
import { GoogleLogin } from "./google-login";
import { OtpVerification } from "./otp-verification";
import { PasskeyLogin } from "./passkey-login";
import { PasswordInput } from "./password-input";
import { useAuthForm } from "./use-auth-form";

function SignupTerms() {
  return (
    <p className="text-xs text-muted-foreground text-center text-balance">
      By signing up, you agree to our{" "}
      <a
        href="/terms"
        className="underline underline-offset-4 hover:text-primary"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        href="/privacy"
        className="underline underline-offset-4 hover:text-primary"
      >
        Privacy Policy
      </a>
      .
    </p>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{text}</span>
      </div>
    </div>
  );
}

interface AuthFormProps extends ComponentProps<"div"> {
  /**
   * UI mode affecting fields, copy, and available methods.
   * "signup" shows name+email+password. "login" shows email+password with OTP/passkey alternatives.
   */
  mode?: "login" | "signup";
  /** Called after successful auth. Awaited before UI progresses. Caller handles cache invalidation and navigation. */
  onSuccess: () => Promise<void>;
  isLoading?: boolean;
  /** Post-auth redirect destination. Must be a safe relative path (validated by caller). */
  returnTo?: string;
}

export function AuthForm({
  className,
  onSuccess,
  isLoading,
  mode = "login",
  returnTo,
  ...props
}: AuthFormProps) {
  const {
    step,
    email,
    password,
    name,
    devOtp,
    isDisabled,
    error,
    forgotPasswordSent,
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
    mode: formMode,
  } = useAuthForm({
    onSuccess,
    isExternallyLoading: isLoading,
    mode,
  });

  // Clear error when user changes inputs
  const handleEmailChange = (value: string) => {
    if (error) setError(null);
    changeEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    if (error) setError(null);
    changePassword(value);
  };

  const handleNameChange = (value: string) => {
    if (error) setError(null);
    changeName(value);
  };

  // Voluntary back from OTP clears error; forced back (via onCancel) preserves it
  const handleOtpBack = () => {
    setError(null);
    resetToEmail();
  };

  const isSignup = formMode === "signup";

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      {/* Brand Mark */}
      <div className="flex flex-col items-center gap-1">
        <Link to="/" aria-label="Go to homepage">
          <span
            className="text-2xl font-semibold tracking-tight text-primary"
            style={{ fontFamily: "Lora, serif" }}
          >
            Serene
          </span>
        </Link>
        <p className="text-xs text-muted-foreground">
          Your AI-Powered Wellness Journal
        </p>
      </div>

      {/* Error message - role="alert" ensures screen readers announce it */}
      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Forgot password success message */}
      {forgotPasswordSent && (
        <div
          role="status"
          className="rounded-md bg-primary/10 p-3 text-sm text-primary"
        >
          If an account exists with that email, you'll receive a password reset
          link shortly.
        </div>
      )}

      {/* Step: Password Form (primary) */}
      {step === "password-form" && (
        <PasswordForm
          isSignup={isSignup}
          email={email}
          password={password}
          name={name}
          isDisabled={isDisabled}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
          onNameChange={handleNameChange}
          onSubmit={isSignup ? signUpWithPassword : signInWithPassword}
          onForgotPassword={handleForgotPassword}
          onOtpClick={goToOtpFlow}
          onGoogleSuccess={onAuthSuccess}
          onPasskeySuccess={onAuthSuccess}
          onError={setError}
          onLoadingChange={setChildBusy}
          returnTo={returnTo}
        />
      )}

      {/* Step: Email Input (OTP flow alternative) */}
      {step === "email" && (
        <EmailInput
          email={email}
          isDisabled={isDisabled}
          onEmailChange={handleEmailChange}
          onSubmit={sendOtp}
          onBack={goToPasswordForm}
        />
      )}

      {/* Step: OTP Verification */}
      {step === "otp" && (
        <OtpStep
          email={email}
          devOtp={devOtp}
          isDisabled={isDisabled}
          onSuccess={onAuthSuccess}
          onError={setError}
          onLoadingChange={setChildBusy}
          onBack={handleOtpBack}
          onCancel={resetToEmail}
        />
      )}
    </div>
  );
}

// Step 1: Password Form (primary auth method)
interface PasswordFormProps {
  isSignup: boolean;
  email: string;
  password: string;
  name: string;
  isDisabled: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onNameChange: (name: string) => void;
  onSubmit: (e?: FormEvent) => void;
  onForgotPassword: () => void;
  onOtpClick: () => void;
  onGoogleSuccess: () => void;
  onPasskeySuccess: () => void;
  onError: (error: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
  returnTo?: string;
}

function PasswordForm({
  isSignup,
  email,
  password,
  name,
  isDisabled,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onSubmit,
  onForgotPassword,
  onOtpClick,
  onGoogleSuccess,
  onPasskeySuccess,
  onError,
  onLoadingChange,
  returnTo,
}: PasswordFormProps) {
  const heading = isSignup ? "Create your account" : "Welcome back";
  const [passwordTouched, setPasswordTouched] = useState(false);
  const showPasswordError =
    passwordTouched && password.length > 0 && password.length < 8;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center">{heading}</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Name field (signup only) */}
        {isSignup && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-name">Name</Label>
            <Input
              id="auth-name"
              name="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={isDisabled}
              autoComplete="name"
            />
          </div>
        )}

        {/* Email field */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isDisabled}
            autoComplete="email"
            required
          />
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="auth-password">Password</Label>
            {!isSignup && (
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={isDisabled}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <PasswordInput
            id="auth-password"
            name="password"
            placeholder={isSignup ? "Min. 8 characters" : "Enter your password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            disabled={isDisabled}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={8}
          />
          {showPasswordError && (
            <p className="text-xs text-destructive">
              Password must be at least 8 characters
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="default"
          className="w-full"
          disabled={isDisabled || !email.trim() || password.length < 8}
        >
          {isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      {/* Divider */}
      <Divider text="or continue with" />

      {/* Alternative auth methods */}
      <div className="flex flex-col gap-3">
        <GoogleLogin
          onError={onError}
          isDisabled={isDisabled}
          onLoadingChange={onLoadingChange}
          returnTo={returnTo}
        />

        {/* OTP alternative (login only) */}
        {!isSignup && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onOtpClick}
              disabled={isDisabled}
            >
              <Mail className="mr-2 h-4 w-4" />
              Use email code instead
            </Button>

            <PasskeyLogin
              onSuccess={onPasskeySuccess}
              onError={onError}
              onLoadingChange={onLoadingChange}
              isDisabled={isDisabled}
            />
          </>
        )}
      </div>

      {isSignup && <SignupTerms />}

      {/* Account switch link */}
      <p className="text-sm text-muted-foreground text-center">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

// Step 2: Email Input (OTP flow)
interface EmailInputProps {
  email: string;
  isDisabled: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: (e?: FormEvent) => void;
  onBack: () => void;
}

function EmailInput({
  email,
  isDisabled,
  onEmailChange,
  onSubmit,
  onBack,
}: EmailInputProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center">
        Sign in with email code
      </h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Enter your email address..."
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isDisabled}
          autoComplete="email"
          autoFocus
          required
        />
        <Button
          type="submit"
          variant="default"
          className="w-full"
          disabled={isDisabled || !email.trim()}
        >
          Send code
        </Button>
      </form>

      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        disabled={isDisabled}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </button>
    </div>
  );
}

// Step 3: OTP Verification
interface OtpStepProps {
  email: string;
  devOtp?: string;
  isDisabled: boolean;
  onSuccess: () => void;
  onError: (error: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onBack: () => void;
  onCancel: () => void;
}

function OtpStep({
  email,
  devOtp,
  isDisabled,
  onSuccess,
  onError,
  onLoadingChange,
  onBack,
  onCancel,
}: OtpStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground mt-1">
          We sent a code to <strong>{email}</strong>
        </p>
      </div>

      <OtpVerification
        email={email}
        devOtp={devOtp}
        onSuccess={onSuccess}
        onError={onError}
        onLoadingChange={onLoadingChange}
        onCancel={onCancel}
        isDisabled={isDisabled}
      />

      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        disabled={isDisabled}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to email
      </button>
    </div>
  );
}
```

**Migration Pattern**:

```tsx
// BEFORE (line 5, AuthStep type imported from use-auth-form):
// step === "method" rendered MethodSelection
// step === "email" rendered EmailInput with isSignup prop
// MethodSelection had onEmailClick, showed Google + Email + Passkey buttons

// AFTER:
// step === "password-form" renders PasswordForm with email+password fields
// step === "email" renders EmailInput (OTP flow, no isSignup prop)
// PasswordForm shows form fields + Google + OTP link + Passkey (login only)
```

**Dependencies**: `apps/app/components/auth/password-input.tsx`, `apps/app/components/auth/use-auth-form.ts`
**Provides**: Updated `AuthForm` component with password-based auth, inline validation, forgot password, all auth methods visible

---

### apps/app/components/auth/auth-form.test.tsx [create]

**Purpose**: Unit tests for the polished auth form. TDD approach — tests written before/alongside implementation. Covers form rendering, validation, login<->signup links, and error display.
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create test file with tests for: signup form fields, login form fields, password show/hide toggle, inline validation, login<->signup links, error display, form submission.

**Implementation Details**:

- Uses `@testing-library/react`, `userEvent`, `vitest`
- Mocks `@/lib/auth` to stub `auth.signUp.email`, `auth.signIn.email`, `auth.forgetPassword`
- Mocks `@tanstack/react-router` for `Link` and `useRouter`
- Uses `QueryClientProvider` wrapper (same pattern as `entry-form.test.tsx`)
- Tests password visibility toggle via clicking the eye icon button

**Reference Implementation**:

```tsx
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
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
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

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
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

    const passwordInput = screen.getByLabelText(/password/i);
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
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
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

    const passwordInput = screen.getByLabelText(/password/i);
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

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
  });
});
```

**Dependencies**: `apps/app/components/auth/auth-form.tsx`, `apps/app/components/auth/password-input.tsx`, `apps/app/components/auth/use-auth-form.ts`
**Provides**: Test coverage for auth form polish requirements

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                          | Action | Depends On                                                                                 |
| ----- | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| 1     | `ai_review/user_stories/auth-flow.yaml`       | create | --                                                                                         |
| 1     | `apps/app/components/auth/password-input.tsx` | create | --                                                                                         |
| 2     | `apps/app/components/auth/use-auth-form.ts`   | edit   | --                                                                                         |
| 3     | `apps/app/components/auth/auth-form.tsx`      | edit   | `apps/app/components/auth/password-input.tsx`, `apps/app/components/auth/use-auth-form.ts` |
| 4     | `apps/app/components/auth/auth-form.test.tsx` | create | `apps/app/components/auth/auth-form.tsx`                                                   |

---

## Exit Criteria

### Test Commands

```bash
bun test --run                    # All tests pass
bun lint                          # ESLint passes
bun typecheck                     # TypeScript type checking passes
bun prettier --check .            # Prettier formatting passes
```

### Success Conditions

- [ ] All tests pass (exit code 0)
- [ ] No linting errors (exit code 0)
- [ ] No type errors (exit code 0)
- [ ] Signup form: name, email, password fields visible with Google OAuth button
- [ ] Login form: email, password fields with Google OAuth, OTP, passkey buttons
- [ ] Password show/hide toggle works
- [ ] Inline validation shows password error on blur when < 8 chars
- [ ] Login <-> signup links present and work
- [ ] Unauthenticated users redirected to /login (existing behavior, unchanged)
- [ ] Post-login redirect to journal dashboard (existing behavior, unchanged)
- [ ] Forgot password link present on login form
- [ ] Error messages do not reveal account existence
- [ ] Bowser QA: `/ui-review auth-flow` -- ALL PASS

### Pipeline Steps (per deliverables.md)

1. [x] Plan created (this file)
2. [ ] Bowser YAML written to `ai_review/user_stories/auth-flow.yaml`
3. [ ] Tests written (TDD: failing tests first)
4. [ ] Implementation complete
5. [ ] `/simplify` run -- code quality verified
6. [ ] `bun prettier --write .` then `bun prettier --check .`
7. [ ] `bun test --run` passes
8. [ ] `/ui-review auth-flow` -- ALL PASS
9. [ ] Fix & re-run if any bowser story fails
10. [ ] Manual pitstop -- human visual review

### Verification Script

```bash
bun test --run && bun lint && bun typecheck && bun prettier --check .
```
