"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApplications, JobFindApiError } from "@/lib/jobfind/api";
import { statusLabels } from "@/lib/jobfind/types";
import { formatDisplayDate } from "@/lib/jobfind/utils";

interface RecentInputsProps {
  refreshKey?: number;
}

export function RecentInputs({ refreshKey = 0 }: RecentInputsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof getApplications>>
  >([]);

  const loadRecent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getApplications({ sort: "newest" });
      setItems(data.slice(0, 3));
    } catch (err) {
      setError(
        err instanceof JobFindApiError
          ? err.message
          : "Failed to load recent applications."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadRecent();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadRecent, refreshKey]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Recent Applications</h2>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading recent applications...
        </div>
      ) : error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No applications saved yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.15 + index * 0.08,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
            >
              <Card className="h-full border-border/60 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="truncate text-base">
                    {item.position} — {item.company}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1.5">
                    <Clock className="size-3" />
                    {formatDisplayDate(item.dateApplied)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Status: {statusLabels[item.status]}
                  </p>
                  {item.notes && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
