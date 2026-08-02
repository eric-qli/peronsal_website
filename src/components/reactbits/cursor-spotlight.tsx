"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface CursorSpotlightProps {
  className?: string;
}

export function CursorSpotlight({ className }: CursorSpotlightProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 40 });
  const [capabilities, setCapabilities] = useState({
    finePointer: false,
    mobile: true,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCapabilities({
        finePointer: window.matchMedia("(pointer: fine)").matches,
        mobile: window.matchMedia("(max-width: 768px)").matches,
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  const enabled =
    capabilities.finePointer && !capabilities.mobile && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const onMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setPosition({ x, y });
    };

    container.addEventListener("mousemove", onMove, { passive: true });
    return () => container.removeEventListener("mousemove", onMove);
  }, [enabled]);

  return (
    <div ref={containerRef} aria-hidden className={cn("absolute inset-0", className)}>
      {enabled ? (
        <div
          className="pointer-events-none absolute inset-0 transition-[background] duration-300 ease-out"
          style={{
            background: `radial-gradient(600px circle at ${position.x}% ${position.y}%, rgba(99,102,241,0.12), transparent 45%)`,
          }}
        />
      ) : null}
    </div>
  );
}
