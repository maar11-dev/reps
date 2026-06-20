import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  return (
    <AuthShell kicker="Welcome back" title="Sign in." subtitle="Pick up your saved plans.">
      <AuthForm mode="sign-in" redirectTo={redirectTo ?? null} />
    </AuthShell>
  );
}
