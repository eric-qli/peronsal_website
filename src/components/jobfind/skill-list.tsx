import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SkillListProps {
  title?: string;
  skills: string[];
  emptyMessage?: string;
  variant?: "badges" | "list";
  className?: string;
}

export function SkillList({
  title,
  skills,
  emptyMessage = "None listed.",
  variant = "badges",
  className,
}: SkillListProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? (
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      ) : null}
      {skills.length > 0 ? (
        variant === "badges" ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </section>
  );
}
