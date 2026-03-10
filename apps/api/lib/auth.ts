import {
  generateAuthId,
  identity,
  session as sessionTable,
  user as userTable,
  verification as verificationTable,
  type AuthModel,
} from "@repo/db";
import { betterAuth } from "better-auth";
import type { DB } from "better-auth/adapters/drizzle";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { emailOTP } from "better-auth/plugins/email-otp";
import { sendOTP, sendPasswordReset, sendVerificationEmail } from "./email";
import type { Env } from "./env";

// Auth hint cookie for edge routing (see docs/adr/001-auth-hint-cookie.md)
// NOT a security boundary - false positives are acceptable (causes one redirect)
// __Host- prefix requires Secure; use plain name in HTTP dev
const AUTH_HINT_VALUE = "1";

/**
 * Environment variables required for authentication configuration.
 * Extracted from the main Env type for better type safety and documentation.
 */
type AuthEnv = Pick<
  Env,
  | "ENVIRONMENT"
  | "APP_NAME"
  | "APP_ORIGIN"
  | "BETTER_AUTH_SECRET"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "RESEND_API_KEY"
  | "RESEND_EMAIL_FROM"
>;

/**
 * Creates a Better Auth instance configured for personal journaling.
 *
 * Key behaviors:
 * - Uses custom 'identity' table instead of default 'account' model for OAuth accounts
 * - Generates prefixed CUID2 IDs at application level (e.g. usr_..., ses_...)
 * - Supports email/password, Google OAuth, and email OTP authentication
 *
 * @param db Drizzle database instance - must include all required auth tables (user, session, identity, verification)
 * @param env Environment variables containing auth secrets and OAuth credentials
 * @returns Configured Better Auth instance with email/password and Google OAuth
 * @remarks Missing database tables will cause runtime errors when auth endpoints are called.
 *
 * @example
 * ```ts
 * const auth = createAuth(database, {
 *   BETTER_AUTH_SECRET: "your-secret",
 *   GOOGLE_CLIENT_ID: "google-id",
 *   GOOGLE_CLIENT_SECRET: "google-secret"
 * });
 * ```
 */
export function createAuth(db: DB, env: AuthEnv) {
  const isDev = env.ENVIRONMENT === "development";
  // Dev-only: temporarily holds the last OTP so the after-hook can
  // inject it into the send-verification-otp response for automated QA.
  let lastDevOtp: string | undefined;

  return betterAuth({
    baseURL: `${env.APP_ORIGIN}/api/auth`,
    trustedOrigins: [env.APP_ORIGIN],
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: {
        identity,
        session: sessionTable,
        user: userTable,
        verification: verificationTable,
      },
    }),

    account: {
      modelName: "identity",
    },

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordReset(env, { user, url });
      },
    },

    // Email verification
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail(env, { user, url });
      },
    },

    // OAuth providers
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          if (isDev) lastDevOtp = otp;
          await sendOTP(env, { email, otp, type });
        },
        otpLength: 6,
        expiresIn: 300, // 5 minutes
        allowedAttempts: 3,
      }),
    ],

    advanced: {
      database: {
        generateId: ({ model }) => generateAuthId(model as AuthModel),
      },
    },

    // Set/clear auth hint cookie for edge routing
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        // Dev-only: return OTP in response so automated QA can auto-fill
        if (
          isDev &&
          ctx.path === "/email-otp/send-verification-otp" &&
          lastDevOtp
        ) {
          const otp = lastDevOtp;
          lastDevOtp = undefined;
          return ctx.json({ success: true, devOtp: otp });
        }

        const isSecure = new URL(env.APP_ORIGIN).protocol === "https:";
        // __Host- prefix requires Secure; browsers reject it over HTTP
        const cookieName = isSecure ? "__Host-auth" : "auth";
        const cookieOpts = {
          path: "/",
          secure: isSecure,
          httpOnly: true,
          sameSite: "lax" as const,
        };

        // Set hint cookie on session creation (sign-in, sign-up, OAuth callback)
        if (ctx.context.newSession) {
          ctx.setCookie(cookieName, AUTH_HINT_VALUE, cookieOpts);
          return;
        }

        // Clear hint cookie on sign-out
        // ctx.path is normalized (base path stripped) by better-call router
        if (ctx.path.startsWith("/sign-out")) {
          ctx.setCookie(cookieName, "", { ...cookieOpts, maxAge: 0 });
          return;
        }

        // Clear stale hint cookie on session check when session is invalid
        // Only run on /get-session where ctx.context.session is reliably populated
        // This handles: expired sessions, revoked sessions, deleted users
        if (ctx.path === "/get-session" && !ctx.context.session) {
          const cookies = ctx.request?.headers.get("cookie") ?? "";
          const hasHintCookie = cookies
            .split(";")
            .some((c) => c.trim().startsWith(`${cookieName}=`));
          if (hasHintCookie) {
            ctx.setCookie(cookieName, "", { ...cookieOpts, maxAge: 0 });
          }
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

// Base session types from Better Auth - plugin-specific fields added at runtime
type SessionResponse = Auth["$Infer"]["Session"];
export type AuthUser = SessionResponse["user"];
export type AuthSession = SessionResponse["session"];
