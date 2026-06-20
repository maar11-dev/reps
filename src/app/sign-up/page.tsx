import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  return (
    <AuthShell kicker="Get started" title="Create account." subtitle="Save and revisit your plans.">
      <AuthForm mode="sign-up" redirectTo={redirectTo ?? null} />
    </AuthShell>
  );
}
