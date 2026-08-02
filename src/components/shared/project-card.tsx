"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { GitHubIcon } from "@/components/icons/social-icons";
import { SpotlightCard } from "@/components/reactbits/spotlight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DURATION, EASE } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  title: string;
  period?: string;
  description: string;
  tags: string[];
  github: string;
  demo: string;
  gradient: string;
  index: number;
}

export function ProjectCard({
  title,
  period,
  description,
  tags,
  github,
  demo,
  gradient,
  index,
}: ProjectCardProps) {
  const reducedMotion = useReducedMotion();

  const card = (
    <SpotlightCard className="flex h-full flex-col">
      <div
        className={cn(
          "relative h-48 overflow-hidden bg-gradient-to-br md:h-52",
          gradient
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl font-bold text-white/10 select-none md:text-8xl">
            0{index + 1}
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-7 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-medium tracking-tight text-foreground transition-colors group-hover:text-indigo-300 md:text-[1.65rem]">
              {title}
            </h3>
            {period ? (
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {period}
              </p>
            ) : null}
          </div>
          <ArrowUpRight className="size-6 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-300 group-hover:opacity-100" />
        </div>

        <p className="mt-4 flex-1 text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border border-white/10 bg-white/5 px-3 py-1 text-sm font-normal transition-transform duration-200 hover:scale-[1.03] md:text-base"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3 border-t border-border/50 pt-7">
          <Button
            render={
              <a href={github} target="_blank" rel="noopener noreferrer">
                <GitHubIcon />
                Code
              </a>
            }
            variant="outline"
            className="h-10 px-4 text-base"
          />
          <Button
            render={
              <a href={demo} target="_blank" rel="noopener noreferrer">
                Live Demo
                <ArrowUpRight />
              </a>
            }
            variant="ghost"
            className="h-10 px-4 text-base"
          />
        </div>
      </div>
    </SpotlightCard>
  );

  if (reducedMotion) {
    return <article className="h-full">{card}</article>;
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: DURATION.normal,
        delay: index * 0.1,
        ease: EASE,
      }}
      className="group h-full"
    >
      {card}
    </motion.article>
  );
}
