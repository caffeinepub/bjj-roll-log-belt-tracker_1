import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Award, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetSubmissionLog, useSaveSubmissionLog, useGetCallerUserProfile } from '../hooks/useQueries';
import type { SubmissionLog, SubmissionCount } from '../backend';
import SubmissionSelectInput from './SubmissionSelectInput';
import {
  addSubmission,
  removeSubmission,
  mergeDuplicates,
} from '../lib/submissionLogUtils';

// Local type for belt levels matching backend BeltProgress.belt structure
type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export default function SubmissionLogSection() {
  const { data: savedLog, isLoading } = useGetSubmissionLog();
  const { data: userProfile } = useGetCallerUserProfile();
  const saveMutation = useSaveSubmissionLog();

  const [localLog, setLocalLog] = useState<SubmissionLog>({
    whiteBelt: [],
    blueBelt: [],
    purpleBelt: [],
    brownBelt: [],
    blackBelt: [],
  });

  // Determine current belt from user profile
  const currentBeltRaw = userProfile?.beltProgress.belt;
  const currentBelt: BeltLevel = currentBeltRaw ? String(currentBeltRaw) as BeltLevel : 'white';

  // Selected opponent belt state (defaults to current belt)
  const [selectedBelt, setSelectedBelt] = useState<BeltLevel>(currentBelt);

  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved data and normalize it
  useEffect(() => {
    if (savedLog) {
      setLocalLog({
        whiteBelt: mergeDuplicates(savedLog.whiteBelt || []),
        blueBelt: mergeDuplicates(savedLog.blueBelt),
        purpleBelt: mergeDuplicates(savedLog.purpleBelt),
        brownBelt: mergeDuplicates(savedLog.brownBelt),
        blackBelt: mergeDuplicates(savedLog.blackBelt),
      });
    }
  }, [savedLog]);

  // Update selected belt when current belt changes
  useEffect(() => {
    setSelectedBelt(currentBelt);
  }, [currentBelt]);

  const handleSave = () => {
    // Normalize before saving to ensure no duplicates
    const normalizedLog: SubmissionLog = {
      whiteBelt: mergeDuplicates(localLog.whiteBelt),
      blueBelt: mergeDuplicates(localLog.blueBelt),
      purpleBelt: mergeDuplicates(localLog.purpleBelt),
      brownBelt: mergeDuplicates(localLog.brownBelt),
      blackBelt: mergeDuplicates(localLog.blackBelt),
    };
    saveMutation.mutate(normalizedLog);
  };

  const updateBelt = (
    belt: keyof SubmissionLog,
    updater: (submissions: SubmissionCount[]) => SubmissionCount[]
  ) => {
    setLocalLog((prev) => ({
      ...prev,
      [belt]: updater(prev[belt]),
    }));
  };

  // Check if local state matches saved state
  const hasUnsavedChanges = () => {
    if (!savedLog) return true;
    
    const compareArrays = (a: SubmissionCount[], b: SubmissionCount[]) => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort((x, y) => x.name.localeCompare(y.name));
      const sortedB = [...b].sort((x, y) => x.name.localeCompare(y.name));
      return sortedA.every((item, idx) => 
        item.name === sortedB[idx].name && item.count === sortedB[idx].count
      );
    };

    return (
      !compareArrays(localLog.whiteBelt, savedLog.whiteBelt || []) ||
      !compareArrays(localLog.blueBelt, savedLog.blueBelt) ||
      !compareArrays(localLog.purpleBelt, savedLog.purpleBelt) ||
      !compareArrays(localLog.brownBelt, savedLog.brownBelt) ||
      !compareArrays(localLog.blackBelt, savedLog.blackBelt)
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">Loading submission log...</p>
        </CardContent>
      </Card>
    );
  }

  // Map BeltLevel to SubmissionLog key
  const getBeltKey = (belt: BeltLevel): keyof SubmissionLog => {
    switch (belt) {
      case 'white':
        return 'whiteBelt';
      case 'blue':
        return 'blueBelt';
      case 'purple':
        return 'purpleBelt';
      case 'brown':
        return 'brownBelt';
      case 'black':
        return 'blackBelt';
      default:
        // Exhaustive check - should never reach here
        const _exhaustive: never = belt;
        return 'whiteBelt';
    }
  };

  const getBeltLabel = (belt: BeltLevel): string => {
    switch (belt) {
      case 'white':
        return 'White Belt';
      case 'blue':
        return 'Blue Belt';
      case 'purple':
        return 'Purple Belt';
      case 'brown':
        return 'Brown Belt';
      case 'black':
        return 'Black Belt';
      default:
        // Exhaustive check - should never reach here
        const _exhaustive: never = belt;
        return 'White Belt';
    }
  };

  const getBeltColorClass = (belt: BeltLevel): string => {
    switch (belt) {
      case 'white':
        return 'text-gray-600';
      case 'blue':
        return 'text-bjj-blue';
      case 'purple':
        return 'text-bjj-purple';
      case 'brown':
        return 'text-bjj-brown';
      case 'black':
        return 'text-bjj-black';
      default:
        // Exhaustive check - should never reach here
        const _exhaustive: never = belt;
        return 'text-gray-600';
    }
  };

  const beltKey = getBeltKey(selectedBelt);
  const label = getBeltLabel(selectedBelt);
  const colorClass = getBeltColorClass(selectedBelt);
  const submissions = localLog[beltKey];
  const totalCount = submissions.reduce((sum, sub) => sum + Number(sub.count), 0);
  const displaySubmissions = isExpanded || submissions.length <= 5 ? submissions : submissions.slice(0, 5);
  const hasMore = submissions.length > 5;

  const showSaveButton = hasUnsavedChanges();

  const allBelts: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black'];

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>Submission Log</CardTitle>
          </div>
          {showSaveButton && (
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              size="sm"
              className="bg-gradient-to-r from-bjj-blue to-bjj-purple hover:from-bjj-blue/90 hover:to-bjj-purple/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
        <CardDescription>
          Track submissions you've successfully executed against different belt levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {/* Belt Selector and Add Submission on same row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Opponent Belt:
              </label>
              <Select value={selectedBelt} onValueChange={(value) => setSelectedBelt(value as BeltLevel)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allBelts.map((belt) => (
                    <SelectItem key={belt} value={belt}>
                      <span className={getBeltColorClass(belt)}>
                        {getBeltLabel(belt)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 w-full sm:w-auto">
              <SubmissionSelectInput
                beltLabel={label}
                submissions={submissions}
                onAdd={(name) => updateBelt(beltKey, (subs) => addSubmission(subs, name))}
              />
            </div>
          </div>

          {/* Belt Section */}
          <div className="flex flex-col gap-2">
            <h4 className={`text-sm font-semibold ${colorClass}`}>
              {label} ({totalCount})
            </h4>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
              {submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No submissions logged yet</p>
              ) : (
                displaySubmissions.map((sub) => (
                  <Badge
                    key={sub.name}
                    variant="secondary"
                    className="flex items-center gap-1.5 px-2 py-0.5 text-xs"
                  >
                    <span>{sub.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-3 w-3 p-0 hover:bg-destructive/20 ml-0.5"
                      onClick={() => updateBelt(beltKey, (subs) => removeSubmission(subs, sub.name))}
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
            
            {hasMore && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show more ({submissions.length - 5} more)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
