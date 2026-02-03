import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Award, X } from 'lucide-react';
import { useGetSubmissionLog, useSaveSubmissionLog } from '../hooks/useQueries';
import type { SubmissionLog, SubmissionCount } from '../backend';
import SubmissionSelectInput from './SubmissionSelectInput';
import {
  addSubmission,
  removeSubmission,
  mergeDuplicates,
} from '../lib/submissionLogUtils';

export default function SubmissionLogSection() {
  const { data: savedLog, isLoading } = useGetSubmissionLog();
  const saveMutation = useSaveSubmissionLog();

  const [localLog, setLocalLog] = useState<SubmissionLog>({
    blueBelt: [],
    purpleBelt: [],
    brownBelt: [],
    blackBelt: [],
  });

  // Load saved data and normalize it
  useEffect(() => {
    if (savedLog) {
      setLocalLog({
        blueBelt: mergeDuplicates(savedLog.blueBelt),
        purpleBelt: mergeDuplicates(savedLog.purpleBelt),
        brownBelt: mergeDuplicates(savedLog.brownBelt),
        blackBelt: mergeDuplicates(savedLog.blackBelt),
      });
    }
  }, [savedLog]);

  const handleSave = () => {
    // Normalize before saving to ensure no duplicates
    const normalizedLog: SubmissionLog = {
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

  const renderBeltSection = (
    beltKey: keyof SubmissionLog,
    label: string,
    colorClass: string
  ) => {
    const submissions = localLog[beltKey];
    const totalCount = submissions.reduce((sum, sub) => sum + Number(sub.count), 0);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-semibold ${colorClass}`}>
            {label} ({totalCount})
          </h4>
        </div>

        <SubmissionSelectInput
          beltLabel={label}
          submissions={submissions}
          onAdd={(name) => updateBelt(beltKey, (subs) => addSubmission(subs, name))}
        />

        <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
          {submissions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No submissions logged yet</p>
          ) : (
            submissions.map((sub) => (
              <Badge
                key={sub.name}
                variant="secondary"
                className="flex items-center gap-1.5 px-2 py-0.5 text-xs"
              >
                <span>{sub.name}</span>
                <span className="font-bold bg-primary/10 px-1 py-0.5 rounded text-[10px]">
                  {Number(sub.count)}
                </span>
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
      </div>
    );
  };

  const showSaveButton = hasUnsavedChanges();

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
          Track submissions you've successfully executed against training partners at same or higher belt levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {renderBeltSection('blueBelt', 'Blue Belt', 'text-bjj-blue')}
          {renderBeltSection('purpleBelt', 'Purple Belt', 'text-bjj-purple')}
          {renderBeltSection('brownBelt', 'Brown Belt', 'text-bjj-brown')}
          {renderBeltSection('blackBelt', 'Black Belt', 'text-bjj-black')}
        </div>
      </CardContent>
    </Card>
  );
}
