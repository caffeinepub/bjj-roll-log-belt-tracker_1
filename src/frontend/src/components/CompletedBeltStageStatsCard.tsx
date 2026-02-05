import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle2 } from 'lucide-react';
import { getSubmissionProficiencyTooltip } from '../lib/submissionProficiencyTooltipCopy';
import type { BeltGamifiedStats } from '../lib/beltStatsCalculator';

type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black';

interface CompletedBeltStageStatsCardProps {
  beltLevel: BeltLevel;
  beltName: string;
  stats: BeltGamifiedStats;
  submissionThreshold: number;
}

export default function CompletedBeltStageStatsCard({
  beltLevel,
  beltName,
  stats,
  submissionThreshold,
}: CompletedBeltStageStatsCardProps) {
  return (
    <Card className="border-2 border-green-500/30 bg-green-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          Completed {beltName}
        </CardTitle>
        <CardDescription>Your preserved stats from this belt stage</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-6">
            {/* Progression */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Progression</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Final progression at this belt.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-medium">
                  {stats.progressionPercent.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(100, stats.progressionPercent)} className="h-2" />
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Experience</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {stats.experienceRaw.hours.toFixed(1)} hours trained at this belt.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-medium">
                  {stats.experiencePercent.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(100, stats.experiencePercent)} className="h-2" />
            </div>

            {/* Submission Proficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Submission Proficiency</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {getSubmissionProficiencyTooltip(beltLevel)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-medium">
                  {stats.submissionProficiencyPercent.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(100, stats.submissionProficiencyPercent)} className="h-2" />
            </div>

            {/* Technique Mastery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Technique Mastery</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {stats.masteryRaw.totalSessions} sessions across all themes.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs font-medium">
                  {stats.techniqueMasteryPercent.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(100, stats.techniqueMasteryPercent)} className="h-2" />
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
