"use client";

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const timeout = setTimeout(() => {
      setReduced(mediaQuery.matches);
    }, 0);

    const onChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);
    return () => {
      clearTimeout(timeout);
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}
