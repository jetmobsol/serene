import { AuthForm } from "@/components/auth";
import { getSafeRedirectUrl } from "@/lib/auth-config";
import { revalidateSession, sessionQueryOptions } from "@/lib/queries/session";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  isRedirect,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { z } from "zod";

// Sanitize returnTo at parse time - consumers get a safe value or undefined
const searchSchema = z.object({
  returnTo: z
    .string()
    .optional()
    .transform((val) => {
      const safe = getSafeRedirectUrl(val);
      return safe === "/" ? undefined : safe;
    })
    .catch(undefined),
});

export const Route = createFileRoute("/(auth)/login")({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    try {
      const session = await context.queryClient.fetchQuery(
        sessionQueryOptions(),
      );

      // Redirect authenticated users to their destination
      if (session?.user && session?.session) {
        throw redirect({ to: search.returnTo ?? "/" });
      }
    } catch (error) {
      // Re-throw redirects, show login form for fetch errors
      if (isRedirect(error)) throw error;
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  async function handleSuccess() {
    await revalidateSession(queryClient, router);
    await router.navigate({ to: search.returnTo ?? "/" });
  }

  return (
    <div className="auth-split-layout">
      {/* Left decorative panel */}
      <aside className="auth-left-panel">
        <div className="auth-left-blob auth-left-blob-1" />
        <div className="auth-left-blob auth-left-blob-2" />
        <div className="auth-left-blob auth-left-blob-3" />
        <div className="auth-left-inner">
          <a href="/" className="auth-left-logo">
            Serene
            <span className="auth-left-dot" />
          </a>
          <div className="auth-left-body">
            <blockquote className="auth-left-quote">
              "The quieter you become,
              <br />
              the more you can hear."
            </blockquote>
            <div className="auth-left-features">
              <div className="auth-left-feature">
                <span className="auth-left-check">✓</span>
                Private & encrypted journal
              </div>
              <div className="auth-left-feature">
                <span className="auth-left-check">✓</span>
                Empathetic AI vibe checks
              </div>
              <div className="auth-left-feature">
                <span className="auth-left-check">✓</span>
                Mood patterns & weekly insights
              </div>
            </div>
          </div>
          <p className="auth-left-footer">Your thoughts, entirely yours.</p>
        </div>
      </aside>

      {/* Right form panel */}
      <div className="auth-right-panel">
        <p className="auth-right-tagline">
          Track your mood, reflect on your day, and receive personalized AI
          insights.
        </p>
        <div className="auth-form-card">
          <AuthForm
            mode="login"
            onSuccess={handleSuccess}
            returnTo={search.returnTo}
          />
        </div>
      </div>
    </div>
  );
}
