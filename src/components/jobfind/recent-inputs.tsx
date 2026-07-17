"use client";

import { motion } from "framer-motion";
import { Clock, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type RecentInput } from "@/lib/mock-jobfind-data";

interface RecentInputsProps {
  inputs: RecentInput[];
}

function formatRelativeDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentInputs({ inputs }: RecentInputsProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Recent URLs</h2>
      {inputs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No job URLs submitted yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inputs.map((input, index) => (
          <motion.div
            key={input.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.15 + index * 0.08,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
          >
            <Card className="h-full cursor-pointer border-border/60 bg-card/60 transition-colors hover:border-primary/30 hover:bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ExternalLink className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">
                      {input.title}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5">
                      <Clock className="size-3" />
                      {formatRelativeDate(input.submittedAt)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="truncate text-sm text-muted-foreground">
                  {input.url}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        </div>
      )}
    </section>
  );
}
