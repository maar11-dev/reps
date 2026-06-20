import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      kicker="Reset password"
      title="New password."
      subtitle="Choose a new password below."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
