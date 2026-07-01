"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, Download } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/social-icons";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/data";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 size-[500px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute top-1/4 -right-24 size-[400px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-[350px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(129,140,248,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(129,140,248,0.06)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="max-w-4xl"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-5 text-base font-semibold tracking-widest text-indigo-300 uppercase md:text-lg"
          >
            University of Toronto · CS (Specialist) & Statistics (Major)
          </motion.p>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl md:leading-[1.08]">
            <span className="text-gradient">{siteConfig.name}</span>
          </h1>

          <p className="mt-5 text-2xl text-foreground/90 md:text-3xl">
            {siteConfig.title}
          </p>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {siteConfig.intro}
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Button render={<Link href="#projects" />} size="lg" className="h-12 px-6 text-base">
              View Projects
            </Button>
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
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
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
      </div>
    </section>
  );
}
