"use client";

import { type ElementType, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal wrapper. Fades + lifts its children into place the first time
 * they enter the viewport (IntersectionObserver — reliable across browsers,
 * unlike CSS `animation-timeline: view()`). Honors prefers-reduced-motion by
 * showing content immediately. The actual motion lives in `.reveal-up` (globals.css).
 *
 * `as` lets it render as the semantically-correct element (e.g. "li" inside a
 * list, "section" for a landmark) instead of always wrapping in a <div>.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
  as,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: ElementType;
}) {
  const Tag = as ?? "div";
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reveal immediately when motion is unwelcome or the APIs aren't available
    // (older browsers, SSR-less test environments like jsdom).
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      data-shown={shown}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={cn("reveal-up", className)}
    >
      {children}
    </Tag>
  );
}
