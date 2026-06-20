import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="display text-2xl text-bone transition-colors group-hover:text-volt">
            {APP_NAME}
          </span>
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-volt" />
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/plans"
            className="font-mono text-xs uppercase tracking-widest text-bone-dim transition-colors hover:text-volt"
          >
            My plans
          </Link>
          <Link
            href="/build"
            className="font-mono text-xs uppercase tracking-widest text-bone-dim transition-colors hover:text-volt"
          >
            Build a plan →
          </Link>
        </nav>
      </div>
    </header>
  );
}
