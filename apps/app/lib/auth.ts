/**
 * @file Better Auth client instance.
 */

import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { authConfig } from "./auth-config";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173";

export const auth = createAuthClient({
  baseURL: baseURL + authConfig.api.basePath,
  plugins: [emailOTPClient()],
});

export type AuthClient = typeof auth;

type SessionResponse = typeof auth.$Infer.Session;
export type User = SessionResponse["user"];
export type Session = SessionResponse["session"];
