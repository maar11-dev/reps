import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      kicker="Reset password"
      title="Forgot password?"
      subtitle="We'll email you a link to set a new one."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
