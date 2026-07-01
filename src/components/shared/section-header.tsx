import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeader({
  label,
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-12 md:mb-16", className)}>
      <p className="mb-4 text-base font-semibold tracking-widest text-indigo-300 uppercase md:text-lg">
        {label}
      </p>
      <h2 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {description}
        </p>
      )}
    </div>
  );
}
