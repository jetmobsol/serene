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
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-6 md:p-10">
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground max-w-xs">
          Track your mood, reflect on your day, and receive personalized AI
          insights.
        </p>
      </div>
      <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-sm ring-1 ring-border/50">
        <AuthForm
          mode="login"
          onSuccess={handleSuccess}
          returnTo={search.returnTo}
        />
      </div>
    </div>
  );
}
