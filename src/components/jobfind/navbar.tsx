"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/jobfind/input", label: "Input" },
  { href: "/jobfind/summary", label: "Summary" },
];

export function JobFindNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-400/20 bg-background/85 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-[4rem] max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-indigo-200"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Portfolio</span>
          </Link>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <Link
            href="/jobfind/input"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-gradient transition-opacity hover:opacity-80"
          >
            <Briefcase className="size-5 text-accent" />
            JobFind
          </Link>
        </div>

        <ul className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/50 p-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <li key={item.href} className="relative">
                {isActive && (
                  <motion.span
                    layoutId="jobfind-nav-indicator"
                    className="absolute inset-0 rounded-md bg-primary/15 ring-1 ring-primary/25"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "relative z-10 block rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
