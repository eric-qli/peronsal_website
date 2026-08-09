"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveSection } from "@/hooks/use-active-section";
import { navLinks, siteConfig } from "@/lib/data";
import { DURATION, EASE } from "@/lib/animation";
import { cn } from "@/lib/utils";

const sectionIds = navLinks
  .filter((link) => link.href.startsWith("#"))
  .map((link) => link.href.replace("#", ""));

function isNavLinkActive(
  href: string,
  activeSection: string,
  pathname: string
): boolean {
  if (href.startsWith("#")) {
    return activeSection === href.slice(1);
  }

  if (href.startsWith("/")) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return false;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeSection = useActiveSection(sectionIds);
  const pathname = usePathname();

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
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
      <nav
        className={cn(
          "mx-auto flex min-h-[4.25rem] max-w-6xl items-center justify-between rounded-2xl px-4 py-2 transition-all duration-300 md:px-6",
          scrolled ? "glass-panel-strong shadow-lg shadow-indigo-950/20" : "glass-panel"
        )}
      >
        <Link
          href="#"
          className="text-lg font-semibold tracking-tight text-gradient transition-opacity hover:opacity-80"
        >
          {siteConfig.name}
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = isNavLinkActive(link.href, activeSection, pathname);

            return (
              <li key={link.href} className="relative">
                {isActive ? (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-lg bg-primary/15 ring-1 ring-primary/25"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <Link
                  href={link.href}
                  className={cn(
                    "relative z-10 block rounded-lg px-4 py-2 text-base transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-indigo-200"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
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
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: DURATION.fast, ease: EASE }}
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl glass-panel-strong shadow-lg md:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 py-4">
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
        ) : null}
      </AnimatePresence>
    </header>
  );
}
