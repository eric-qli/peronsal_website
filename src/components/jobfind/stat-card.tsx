"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "default" | "success" | "warning" | "danger";
  index?: number;
}

const accentStyles = {
  default: "text-accent bg-accent/10 ring-accent/20",
  success: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20",
  warning: "text-amber-400 bg-amber-400/10 ring-amber-400/20",
  danger: "text-red-400 bg-red-400/10 ring-red-400/20",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "default",
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg ring-1",
              accentStyles[accent]
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
