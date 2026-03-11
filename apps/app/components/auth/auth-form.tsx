import { Button, Input, Label, cn } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import type { ComponentProps, FormEvent } from "react";
import { useState } from "react";
import { GoogleLogin } from "./google-login";
import { OtpVerification } from "./otp-verification";
import { PasswordInput } from "./password-input";
import { useAuthForm } from "./use-auth-form";

function BackLink({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
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

  // Clear error when user changes any input
  const withErrorClear = (setter: (v: string) => void) => (value: string) => {
    if (error) setError(null);
    setter(value);
  };

  const handleEmailChange = withErrorClear(changeEmail);
  const handlePasswordChange = withErrorClear(changePassword);
  const handleNameChange = withErrorClear(changeName);

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
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
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
          onError={setError}
          onLoadingChange={setChildBusy}
          returnTo={returnTo}
        />
      )}

      {/* Step: Email Input (OTP alternative) */}
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
      <h1 className="text-3xl text-center">{heading}</h1>

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
        )}
      </div>

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
      <h1 className="text-3xl text-center">Sign in with email code</h1>

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

      <BackLink onClick={onBack} disabled={isDisabled}>
        Back to sign in
      </BackLink>
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
        <h1 className="text-3xl">Check your email</h1>
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

      <BackLink onClick={onBack} disabled={isDisabled}>
        Back to email
      </BackLink>
    </div>
  );
}
