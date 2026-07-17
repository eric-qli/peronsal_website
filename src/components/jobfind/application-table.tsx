"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type Application,
  type ApplicationStatus,
  type SortOption,
  sortOptions,
  statusFilterOptions,
} from "@/lib/mock-jobfind-data";
import { cn } from "@/lib/utils";

interface ApplicationTableProps {
  applications: Application[];
}

const statusVariant: Record<
  ApplicationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Applied: "secondary",
  Interview: "default",
  Offer: "default",
  Rejected: "destructive",
  Pending: "outline",
};

const statusClassName: Record<ApplicationStatus, string> = {
  Applied: "",
  Interview: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Offer: "bg-accent/15 text-accent border-accent/25",
  Rejected: "",
  Pending: "",
};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortApplications(
  applications: Application[],
  sortBy: SortOption
): Application[] {
  const sorted = [...applications];

  switch (sortBy) {
    case "date-desc":
      return sorted.sort(
        (a, b) =>
          new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
      );
    case "date-asc":
      return sorted.sort(
        (a, b) =>
          new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime()
      );
    case "company-asc":
      return sorted.sort((a, b) => a.company.localeCompare(b.company));
    case "company-desc":
      return sorted.sort((a, b) => b.company.localeCompare(a.company));
    case "match-desc":
      return sorted.sort((a, b) => b.resumeMatch - a.resumeMatch);
    case "match-asc":
      return sorted.sort((a, b) => a.resumeMatch - b.resumeMatch);
    default:
      return sorted;
  }
}

function MatchIndicator({ value }: { value: number }) {
  const color =
    value >= 85
      ? "text-emerald-400"
      : value >= 70
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-current", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn("text-sm font-medium tabular-nums", color)}>
        {value}%
      </span>
    </div>
  );
}

export function ApplicationTable({ applications }: ApplicationTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">(
    "All"
  );
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = applications.filter((app) => {
      const matchesStatus =
        statusFilter === "All" || app.status === statusFilter;
      const matchesSearch =
        !query ||
        app.company.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query) ||
        app.location.toLowerCase().includes(query) ||
        app.keywords.some((keyword) => keyword.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });

    return sortApplications(filtered, sortBy);
  }, [applications, search, sortBy, statusFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applications..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ApplicationStatus | "All")
            }
          >
            <SelectTrigger className="w-full min-w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "All" ? "All Statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-full min-w-[180px] sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date Applied</TableHead>
              <TableHead>Resume Match</TableHead>
              <TableHead className="hidden lg:table-cell">Keywords</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No applications match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.company}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">
                    {app.position}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {app.location}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[app.status]}
                      className={statusClassName[app.status]}
                    >
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatDate(app.dateApplied)}
                  </TableCell>
                  <TableCell>
                    <MatchIndicator value={app.resumeMatch} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {app.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredApplications.length} of {applications.length}{" "}
        applications
      </p>
    </motion.div>
  );
}
