import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type SkillMatchResult } from "@/lib/jobfind/match";

interface MatchScoreCardProps {
  match: SkillMatchResult;
}

export function MatchScoreCard({ match }: MatchScoreCardProps) {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Resume Match</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!match.available ? (
          <p className="text-sm text-muted-foreground">Match score unavailable</p>
        ) : (
          <>
            <p className="text-3xl font-semibold tracking-tight">
              {match.percentage}% Match
            </p>

            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Matched</p>
                {match.matched.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {match.matched.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Missing</p>
                {match.missing.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {match.missing.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Current score is based on keyword overlap with my saved technical profile.
        </p>
      </CardContent>
    </Card>
  );
}
