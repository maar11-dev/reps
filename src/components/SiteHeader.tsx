import Link from "next/link";
import { AuthNav } from "@/components/auth/AuthNav";
import { APP_NAME } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-bone bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="display border-2 border-volt-ink bg-volt px-2 py-0.5 text-2xl leading-none text-volt-ink shadow-[3px_3px_0_0_var(--color-bone)] transition-transform group-hover:-translate-x-px group-hover:-translate-y-px">
            {APP_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/plans"
            className="font-mono text-xs uppercase tracking-widest text-bone-dim transition-colors hover:text-volt"
          >
            My plans
          </Link>
          <Link
            href="/build"
            className="hidden font-mono text-xs uppercase tracking-widest text-bone-dim transition-colors hover:text-volt sm:inline"
          >
            Build a plan →
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
