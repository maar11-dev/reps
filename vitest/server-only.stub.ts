// Empty stub: in the app, `import "server-only"` is resolved to a no-op by the
// Next.js RSC bundler (via the `react-server` export condition). Vitest has no
// such condition, so we alias `server-only` to this empty module for tests.
// This does NOT weaken the real guard — the production build still fails if a
// client component imports a `server-only` module.
export {};
