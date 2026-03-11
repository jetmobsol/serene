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

export const Route = createFileRoute("/(auth)/signup")({
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
      // Re-throw redirects, show signup form for fetch errors
      if (isRedirect(error)) throw error;
    }
  },
  component: SignupPage,
});

function SignupPage() {
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
              "Knowing yourself is the beginning of all wisdom."
            </blockquote>
            <div className="auth-left-features">
              <div className="auth-left-feature">
                <span className="auth-left-check">✓</span>
                Free — no credit card required
              </div>
              <div className="auth-left-feature">
                <span className="auth-left-check">✓</span>
                Journal in under 60 seconds
              </div>
              <div className="auth-left-feature">
                <span className="auth-left-check">✓</span>
                Gentle AI encouragement after each entry
              </div>
            </div>
          </div>
          <p className="auth-left-footer">Your quiet place awaits.</p>
        </div>
      </aside>

      {/* Right form panel */}
      <div className="auth-right-panel">
        <p className="auth-right-tagline">
          Begin your wellness journey with AI-powered mood tracking and
          personalized insights.
        </p>
        <div className="auth-form-card">
          <AuthForm
            mode="signup"
            onSuccess={handleSuccess}
            returnTo={search.returnTo}
          />
        </div>
      </div>
    </div>
  );
}
