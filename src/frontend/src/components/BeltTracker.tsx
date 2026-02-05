import { useState, useEffect, useMemo } from 'react';
import { useGetCallerUserProfile, useUpdateBeltProgress, useGetTrainingRecords, useGetSubmissionLog } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { BeltProgress, SubmissionLog } from '../backend';
import { getBeltImageUrl, getBeltName, preloadAllBeltImages } from '../lib/beltUtils';
import { calculateBeltGamifiedStats } from '../lib/beltStatsCalculator';
import { Loader2, Award, Lock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black';

const BELT_ORDER: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black'];

// Belt color mapping for badge backgrounds
const BELT_COLORS: Record<BeltLevel, string> = {
  white: 'bg-gray-100 text-gray-900 border-gray-300',
  blue: 'bg-bjj-blue text-white',
  purple: 'bg-bjj-purple text-white',
  brown: 'bg-bjj-brown text-white',
  black: 'bg-gray-900 text-white',
};

// Belt-specific submission thresholds
const SUBMISSION_THRESHOLDS: Record<string, number> = {
  white: 5,
  blue: 25,
  purple: 40,
  brown: 60,
  black: 80,
};

export default function BeltTracker() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const { data: trainingSessions = [], isLoading: sessionsLoading } = useGetTrainingRecords();
  const { data: submissionLog, isLoading: submissionLoading } = useGetSubmissionLog();
  const updateBeltMutation = useUpdateBeltProgress();

  const [selectedBelt, setSelectedBelt] = useState<BeltLevel | null>(null);
  const [selectedStripes, setSelectedStripes] = useState<number | null>(null);

  // Preload all belt images on component mount for better caching
  useEffect(() => {
    preloadAllBeltImages();
  }, []);

  // Calculate gamified stats
  const gamifiedStats = useMemo(() => {
    if (!userProfile || !submissionLog) return null;
    
    // Type assertion to ensure submissionLog has all required fields
    const fullSubmissionLog: SubmissionLog = {
      whiteBelt: submissionLog.whiteBelt || [],
      blueBelt: submissionLog.blueBelt || [],
      purpleBelt: submissionLog.purpleBelt || [],
      brownBelt: submissionLog.brownBelt || [],
      blackBelt: submissionLog.blackBelt || [],
    };
    
    return calculateBeltGamifiedStats(
      userProfile.beltProgress.belt as BeltLevel,
      Number(userProfile.beltProgress.stripes),
      trainingSessions,
      fullSubmissionLog
    );
  }, [userProfile, trainingSessions, submissionLog]);

  if (isLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading belt progress...</p>
      </div>
    );
  }

  const currentBelt = userProfile.beltProgress.belt as BeltLevel;
  const currentStripes = Number(userProfile.beltProgress.stripes);

  const displayBelt = selectedBelt || currentBelt;
  const displayStripes = selectedStripes !== null ? selectedStripes : currentStripes;

  const hasChanges = selectedBelt !== null || selectedStripes !== null;

  const handleUpdate = () => {
    const newBelt = selectedBelt || currentBelt;
    const newStripes = selectedStripes !== null ? selectedStripes : currentStripes;

    updateBeltMutation.mutate(
      {
        belt: newBelt,
        stripes: BigInt(newStripes),
        imageUrl: getBeltImageUrl(newBelt, newStripes),
      },
      {
        onSuccess: () => {
          setSelectedBelt(null);
          setSelectedStripes(null);
        },
      }
    );
  };

  const handleReset = () => {
    setSelectedBelt(null);
    setSelectedStripes(null);
  };

  // Determine belt states
  const currentBeltIndex = BELT_ORDER.indexOf(currentBelt);
  const getBeltState = (belt: BeltLevel): 'completed' | 'current' | 'next' | 'locked' => {
    const beltIndex = BELT_ORDER.indexOf(belt);
    if (beltIndex < currentBeltIndex) return 'completed';
    if (beltIndex === currentBeltIndex) return 'current';
    if (beltIndex === currentBeltIndex + 1) return 'next';
    return 'locked';
  };

  // Get submission threshold for current belt
  const getSubmissionThreshold = (belt: BeltLevel): number => {
    return SUBMISSION_THRESHOLDS[belt] || 0;
  };

  const statsLoading = sessionsLoading || submissionLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Belt Progress Tracker</h2>
        <p className="text-muted-foreground">Track your journey through the ranks</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-bjj-purple" />
              Current Belt
            </CardTitle>
            <CardDescription>Your current rank and stripe progression</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-6 text-center space-y-4">
              <div className="text-2xl font-bold">{getBeltName(displayBelt)}</div>
              <img
                src={getBeltImageUrl(displayBelt, displayStripes)}
                alt={`${displayBelt} belt with ${displayStripes} stripes`}
                className="h-16 w-full object-contain"
                loading="eager"
              />
              <p className="text-sm text-muted-foreground">
                {displayStripes === 0
                  ? 'No stripes'
                  : `${displayStripes} stripe${displayStripes !== 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="space-y-4">
              {/* Update Belt and Update Stripes in the same row - always side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 min-w-0">
                  <Label className="text-xs sm:text-sm">Update Belt</Label>
                  <Select
                    value={selectedBelt || currentBelt}
                    onValueChange={(value) => setSelectedBelt(value as BeltLevel)}
                  >
                    <SelectTrigger className="w-full text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White Belt</SelectItem>
                      <SelectItem value="blue">Blue Belt</SelectItem>
                      <SelectItem value="purple">Purple Belt</SelectItem>
                      <SelectItem value="brown">Brown Belt</SelectItem>
                      <SelectItem value="black">Black Belt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-0">
                  <Label className="text-xs sm:text-sm">Update Stripes</Label>
                  <Select
                    value={(selectedStripes !== null ? selectedStripes : currentStripes).toString()}
                    onValueChange={(value) => setSelectedStripes(parseInt(value))}
                  >
                    <SelectTrigger className="w-full text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Stripes</SelectItem>
                      <SelectItem value="1">1 Stripe</SelectItem>
                      <SelectItem value="2">2 Stripes</SelectItem>
                      <SelectItem value="3">3 Stripes</SelectItem>
                      <SelectItem value="4">4 Stripes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasChanges && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset} className="flex-1">
                    Reset
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={updateBeltMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-bjj-blue to-bjj-purple hover:from-bjj-blue/90 hover:to-bjj-purple/90"
                  >
                    {updateBeltMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Progress'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Belt Progression Stats moved here */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Belt Progression Stats</h3>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : gamifiedStats ? (
                <TooltipProvider>
                  <div className="space-y-6">
                    {/* Progression */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Progression</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">How close you are to the next belt.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {gamifiedStats.progressionPercent.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(100, gamifiedStats.progressionPercent)} className="h-3" />
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Experience</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Hours of mat experience at this belt.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {gamifiedStats.experiencePercent.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(100, gamifiedStats.experiencePercent)} className="h-3" />
                    </div>

                    {/* Submission Proficiency */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Submission Proficiency</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Unique submissions for {getBeltName(currentBelt)}. Target: {getSubmissionThreshold(currentBelt)}.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {gamifiedStats.submissionProficiencyPercent.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(100, gamifiedStats.submissionProficiencyPercent)} className="h-3" />
                    </div>

                    {/* Technique Mastery */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Technique Mastery</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Technical theme coverage achieved at this belt.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {gamifiedStats.techniqueMasteryPercent.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(100, gamifiedStats.techniqueMasteryPercent)} className="h-3" />
                    </div>
                  </div>
                </TooltipProvider>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No stats available yet. Start training to see your progress!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Belt Progression</CardTitle>
            <CardDescription>The journey from white to black belt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BELT_ORDER.map((belt) => {
              const state = getBeltState(belt);
              const isCurrent = state === 'current';
              const isLocked = state === 'locked' || state === 'next';
              const isNext = state === 'next';

              return (
                <div
                  key={belt}
                  className={cn(
                    'rounded-lg border-2 p-4 transition-all relative',
                    isCurrent && 'border-bjj-purple bg-bjj-purple/5',
                    !isCurrent && !isLocked && 'border-border',
                    isLocked && 'border-border/50',
                    isNext && 'border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className={cn(
                        'font-semibold', 
                        isLocked && 'text-muted-foreground'
                      )}
                      style={isLocked ? { opacity: 0.5 } : undefined}
                    >
                      {getBeltName(belt)}
                    </span>
                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <Badge className={cn('border', BELT_COLORS[belt])}>
                          Current
                        </Badge>
                      )}
                      {isNext && <Badge variant="outline" className="border-bjj-blue text-bjj-blue">Next</Badge>}
                      {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  <img
                    src={getBeltImageUrl(belt, 0)}
                    alt={`${belt} belt`}
                    className={cn(
                      'h-10 w-full object-contain transition-all'
                    )}
                    style={isLocked ? { opacity: 0.5, filter: 'saturate(0.3) brightness(0.9)' } : undefined}
                    loading="eager"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
