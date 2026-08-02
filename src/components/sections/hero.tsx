"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, Download } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/social-icons";
import { AuroraBackground } from "@/components/reactbits/aurora-background";
import { CursorSpotlight } from "@/components/reactbits/cursor-spotlight";
import { MagneticButton } from "@/components/reactbits/magnetic-button";
import { RevealGroup, RevealItem } from "@/components/reactbits/reveal-text";
import { Button } from "@/components/ui/button";
import { DURATION, EASE } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { siteConfig } from "@/lib/data";

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      <AuroraBackground />
      <CursorSpotlight />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <RevealGroup className="max-w-4xl" delay={0.05}>
          <RevealItem>
            <p className="mb-5 text-base font-semibold tracking-widest text-indigo-300 uppercase md:text-lg">
              University of Toronto · CS (Specialist) & Statistics (Major)
            </p>
          </RevealItem>

          <RevealItem>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl md:leading-[1.08]">
              <span className="text-gradient">{siteConfig.name}</span>
            </h1>
          </RevealItem>

          <RevealItem>
            <p className="mt-5 text-2xl text-foreground/90 md:text-3xl">
              {siteConfig.title}
            </p>
          </RevealItem>

          <RevealItem>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {siteConfig.intro}
            </p>
          </RevealItem>

          <RevealItem>
            <div className="mt-12 flex flex-wrap gap-4">
              <MagneticButton>
                <Button render={<Link href="#projects" />} size="lg" className="h-12 px-6 text-base">
                  View Projects
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button
                  render={
                    <a href={siteConfig.links.resume} download>
                      <Download />
                      Download Resume
                    </a>
                  }
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base"
                />
              </MagneticButton>
              <MagneticButton>
                <Button
                  render={
                    <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
                      <GitHubIcon />
                      GitHub
                    </a>
                  }
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base"
                />
              </MagneticButton>
              <MagneticButton>
                <Button
                  render={
                    <a href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer">
                      <LinkedInIcon />
                      LinkedIn
                    </a>
                  }
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base"
                />
              </MagneticButton>
            </div>
          </RevealItem>
        </RevealGroup>

        {!reducedMotion ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: DURATION.normal, ease: EASE }}
            className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block"
          >
            <Link
              href="#about"
              className="flex flex-col items-center gap-2 text-indigo-300/80 transition-colors hover:text-indigo-200"
              aria-label="Scroll to about section"
            >
              <span className="text-sm tracking-widest uppercase">Scroll</span>
              <ArrowDown className="size-5 animate-bounce" />
            </Link>
          </motion.div>
        ) : (
          <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block">
            <Link
              href="#about"
              className="flex flex-col items-center gap-2 text-indigo-300/80 transition-colors hover:text-indigo-200"
              aria-label="Scroll to about section"
            >
              <span className="text-sm tracking-widest uppercase">Scroll</span>
              <ArrowDown className="size-5" />
            </Link>
          </div>
        )}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background"
      />
    </section>
  );
}
