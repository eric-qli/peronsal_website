"use client";

import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/social-icons";
import { GradientBorder } from "@/components/reactbits/gradient-border";
import { MagneticButton } from "@/components/reactbits/magnetic-button";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { DURATION, EASE } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { siteConfig } from "@/lib/data";
import { cn } from "@/lib/utils";

const contactLinks = [
  {
    label: "Email",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    icon: Mail,
    color: "hover:border-indigo-400/50 hover:bg-indigo-500/15 hover:shadow-indigo-500/20",
    iconColor: "text-indigo-300",
  },
  {
    label: "Phone",
    value: siteConfig.phone,
    href: `tel:${siteConfig.phone.replace(/-/g, "")}`,
    icon: Phone,
    color: "hover:border-emerald-400/50 hover:bg-emerald-500/15 hover:shadow-emerald-500/20",
    iconColor: "text-emerald-300",
  },
  {
    label: "GitHub",
    value: "github.com/eric-qli",
    href: siteConfig.links.github,
    icon: GitHubIcon,
    color: "hover:border-violet-400/50 hover:bg-violet-500/15 hover:shadow-violet-500/20",
    iconColor: "text-violet-300",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/eric-li-eqli",
    href: siteConfig.links.linkedin,
    icon: LinkedInIcon,
    color: "hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:shadow-cyan-500/20",
    iconColor: "text-cyan-300",
  },
];

export function Contact() {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatedSection id="contact" className="section-tint-gradient py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          label="Contact"
          title="Let's connect"
          description="Open to software engineering and data engineering opportunities. Reach out anytime."
        />

        <GradientBorder>
          <div className="relative overflow-hidden p-6 md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 right-0 size-64 rounded-full bg-indigo-500/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 left-0 size-64 rounded-full bg-cyan-500/10 blur-3xl"
            />

            <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {contactLinks.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target={link.label === "Email" || link.label === "Phone" ? undefined : "_blank"}
                  rel={
                    link.label === "Email" || link.label === "Phone"
                      ? undefined
                      : "noopener noreferrer"
                  }
                  initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: DURATION.normal, ease: EASE }}
                  whileHover={reducedMotion ? undefined : { y: -4 }}
                  className={cn(
                    "group flex flex-col gap-5 rounded-xl border border-border/60 bg-card/60 p-7 transition-all duration-300 hover:shadow-lg md:p-8",
                    link.color
                  )}
                >
                  <link.icon
                    className={cn(
                      "size-7 transition-transform duration-300 group-hover:scale-110",
                      link.iconColor
                    )}
                  />
                  <div>
                    <p className="text-base text-muted-foreground md:text-lg">{link.label}</p>
                    <p className="mt-1.5 text-base font-medium text-foreground transition-colors group-hover:text-white md:text-lg">
                      {link.value}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="relative mt-14 flex justify-center">
              <MagneticButton>
                <Button
                  render={<a href={`mailto:${siteConfig.email}`} />}
                  size="lg"
                  className="h-12 px-8 text-base"
                >
                  <Mail />
                  Send an email
                </Button>
              </MagneticButton>
            </div>
          </div>
        </GradientBorder>
      </div>
    </AnimatedSection>
  );
}
