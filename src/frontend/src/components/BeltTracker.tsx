import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useUpdateBeltProgress } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BeltLevel } from '../backend';
import { getBeltImageUrl, getBeltName, preloadAllBeltImages } from '../lib/beltUtils';
import { Loader2, Award, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const BELT_ORDER = [BeltLevel.white, BeltLevel.blue, BeltLevel.purple, BeltLevel.brown, BeltLevel.black];

// Belt color mapping for badge backgrounds
const BELT_COLORS: Record<BeltLevel, string> = {
  [BeltLevel.white]: 'bg-gray-100 text-gray-900 border-gray-300',
  [BeltLevel.blue]: 'bg-bjj-blue text-white',
  [BeltLevel.purple]: 'bg-bjj-purple text-white',
  [BeltLevel.brown]: 'bg-bjj-brown text-white',
  [BeltLevel.black]: 'bg-gray-900 text-white',
};

export default function BeltTracker() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const updateBeltMutation = useUpdateBeltProgress();

  const [selectedBelt, setSelectedBelt] = useState<BeltLevel | null>(null);
  const [selectedStripes, setSelectedStripes] = useState<number | null>(null);

  // Preload all belt images on component mount for better caching
  useEffect(() => {
    preloadAllBeltImages();
  }, []);

  if (isLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading belt progress...</p>
      </div>
    );
  }

  const currentBelt = userProfile.beltProgress.belt;
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
              <div className="space-y-2">
                <Label>Update Belt</Label>
                <Select
                  value={selectedBelt || currentBelt}
                  onValueChange={(value) => setSelectedBelt(value as BeltLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BeltLevel.white}>White Belt</SelectItem>
                    <SelectItem value={BeltLevel.blue}>Blue Belt</SelectItem>
                    <SelectItem value={BeltLevel.purple}>Purple Belt</SelectItem>
                    <SelectItem value={BeltLevel.brown}>Brown Belt</SelectItem>
                    <SelectItem value={BeltLevel.black}>Black Belt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Update Stripes</Label>
                <Select
                  value={(selectedStripes !== null ? selectedStripes : currentStripes).toString()}
                  onValueChange={(value) => setSelectedStripes(parseInt(value))}
                >
                  <SelectTrigger>
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
              const isLocked = state === 'locked';
              const isNext = state === 'next';

              return (
                <div
                  key={belt}
                  className={cn(
                    'rounded-lg border-2 p-4 transition-all relative',
                    isCurrent && 'border-bjj-purple bg-bjj-purple/5',
                    !isCurrent && !isLocked && !isNext && 'border-border',
                    (isLocked || isNext) && 'border-border/50'
                  )}
                  style={(isLocked || isNext) ? { opacity: 0.5 } : undefined}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('font-semibold', (isLocked || isNext) && 'text-muted-foreground')}>
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
                      'h-10 w-full object-contain transition-all',
                      (isLocked || isNext) && 'saturate-[0.3] brightness-90'
                    )}
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
