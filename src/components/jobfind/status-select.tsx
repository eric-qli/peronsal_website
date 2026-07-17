"use client";

import {
  applicationStatuses,
  statusLabels,
  type ApplicationStatus,
} from "@/lib/jobfind/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StatusSelectProps {
  value: ApplicationStatus;
  onValueChange: (value: ApplicationStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function StatusSelect({
  value,
  onValueChange,
  disabled = false,
  className,
}: StatusSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as ApplicationStatus)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-8 min-w-[120px]", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {applicationStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {statusLabels[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
