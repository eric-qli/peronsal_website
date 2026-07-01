"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks, siteConfig } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-indigo-400/20 bg-background/85 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex min-h-[4.5rem] max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="#"
          className="text-lg font-semibold tracking-tight text-gradient transition-opacity hover:opacity-80"
        >
          {siteConfig.name}
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-base text-muted-foreground transition-colors hover:text-indigo-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Button render={<Link href="#contact" />} size="lg" variant="outline" className="text-base">
            Get in touch
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="border-b border-indigo-400/20 bg-background/95 backdrop-blur-xl md:hidden"
        >
          <ul className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-indigo-500/10 hover:text-indigo-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Button
                render={<Link href="#contact" onClick={() => setMobileOpen(false)} />}
                variant="outline"
                className="w-full"
              >
                Get in touch
              </Button>
            </li>
          </ul>
        </motion.div>
      )}
    </header>
  );
}
