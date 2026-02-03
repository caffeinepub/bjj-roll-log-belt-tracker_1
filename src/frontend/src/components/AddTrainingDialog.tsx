import { useState, useEffect } from 'react';
import { useAddTrainingRecord, useSaveTrainingRecords, useGetTrainingRecords } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { TrainingSession, TrainingType, SessionTheme } from '../backend';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface AddTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSession?: TrainingSession | null;
}

const SESSION_THEMES: { value: SessionTheme; label: string }[] = [
  { value: SessionTheme.takedowns_standup, label: 'Takedowns / Stand-up' },
  { value: SessionTheme.guardSystems, label: 'Guard Systems' },
  { value: SessionTheme.guardRetention, label: 'Guard Retention' },
  { value: SessionTheme.guardPassing, label: 'Guard Passing' },
  { value: SessionTheme.sweeps, label: 'Sweeps' },
  { value: SessionTheme.pinsControl, label: 'Pins & Control' },
  { value: SessionTheme.backControl, label: 'Back Control' },
  { value: SessionTheme.escapes, label: 'Escapes' },
  { value: SessionTheme.submissions, label: 'Submissions' },
  { value: SessionTheme.legLocks, label: 'Leg Locks' },
  { value: SessionTheme.transitionsScrambles, label: 'Transitions & Scrambles' },
  { value: SessionTheme.turtleGame, label: 'Turtle Game' },
  { value: SessionTheme.openMat, label: 'Open Mat' },
];

const QUICK_DURATIONS = [0.5, 1, 1.5, 2];
const MOOD_LABELS = ['Tough', 'Hard', 'Okay', 'Good', 'Great'];

export default function AddTrainingDialog({ open, onOpenChange, editingSession }: AddTrainingDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [duration, setDuration] = useState(1); // in hours
  const [trainingType, setTrainingType] = useState<TrainingType>(TrainingType.gi);
  const [sessionTheme, setSessionTheme] = useState<SessionTheme>(SessionTheme.guardSystems);
  const [rolls, setRolls] = useState(0);
  const [moodRating, setMoodRating] = useState(0.5); // 0 to 1 scale

  const addMutation = useAddTrainingRecord();
  const saveMutation = useSaveTrainingRecords();
  const { data: sessions = [] } = useGetTrainingRecords();

  useEffect(() => {
    if (editingSession) {
      const sessionDate = new Date(Number(editingSession.date) / 1000000);
      setDate(sessionDate);
      setWeekStart(startOfWeek(sessionDate, { weekStartsOn: 1 }));
      setDuration(Number(editingSession.duration) / 60); // Convert minutes to hours
      setTrainingType(editingSession.trainingType);
      setSessionTheme(editingSession.sessionTheme);
      setRolls(Number(editingSession.rolls));
      setMoodRating(editingSession.moodRating);
    } else {
      resetForm();
    }
  }, [editingSession, open]);

  const resetForm = () => {
    const today = new Date();
    setDate(today);
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setDuration(1);
    setTrainingType(TrainingType.gi);
    setSessionTheme(SessionTheme.guardSystems);
    setRolls(0);
    setMoodRating(0.5);
  };

  const handlePreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const handleDurationIncrement = () => {
    setDuration((prev) => prev + 0.25);
  };

  const handleDurationDecrement = () => {
    setDuration((prev) => Math.max(0.25, prev - 0.25));
  };

  const handleQuickDuration = (hours: number) => {
    setDuration(hours);
  };

  const getMoodLabel = (rating: number): string => {
    const index = Math.round(rating * (MOOD_LABELS.length - 1));
    return MOOD_LABELS[Math.max(0, Math.min(index, MOOD_LABELS.length - 1))];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // CRITICAL: Store date in local time using midnight of the selected date
    // This ensures consistent date handling across Training Log and Heat Map
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const session: TrainingSession = {
      id: editingSession?.id || `session-${Date.now()}`,
      date: BigInt(localDate.getTime() * 1000000), // Store local midnight time
      duration: BigInt(Math.round(duration * 60)), // Convert hours to minutes
      trainingType,
      sessionTheme,
      rolls: BigInt(rolls),
      moodRating,
    };

    if (editingSession) {
      const updatedSessions = sessions.map((s) => (s.id === editingSession.id ? session : s));
      saveMutation.mutate(updatedSessions, {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      });
    } else {
      addMutation.mutate(session, {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      });
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editingSession ? 'Edit Training Session' : 'Log Training Session'}</DialogTitle>
          <DialogDescription>
            {editingSession ? 'Update your training session details' : 'Record the details of your training session'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Week View Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousWeek}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleNextWeek}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setDate(day)}
                      className={cn(
                        'flex flex-col items-center justify-center p-2 rounded-lg border transition-colors',
                        isSameDay(day, date)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-accent hover:text-accent-foreground border-border'
                      )}
                    >
                      <span className="text-xs font-medium">
                        {format(day, 'EEE')}
                      </span>
                      <span className="text-lg font-semibold">
                        {format(day, 'd')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration Input with Increment/Decrement */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDurationDecrement}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-semibold">{duration.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground ml-1">hours</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDurationIncrement}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 justify-center">
                  {QUICK_DURATIONS.map((hours) => (
                    <Button
                      key={hours}
                      type="button"
                      variant={duration === hours ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleQuickDuration(hours)}
                    >
                      {hours}h
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Training Type Toggle */}
            <div className="space-y-2">
              <Label>Training Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={trainingType === TrainingType.gi ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTrainingType(TrainingType.gi)}
                >
                  Gi
                </Button>
                <Button
                  type="button"
                  variant={trainingType === TrainingType.noGi ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTrainingType(TrainingType.noGi)}
                >
                  No-Gi
                </Button>
              </div>
            </div>

            {/* Session Theme Selector */}
            <div className="space-y-2">
              <Label>Session Theme</Label>
              <div className="flex flex-wrap gap-2">
                {SESSION_THEMES.map((theme) => (
                  <Badge
                    key={theme.value}
                    variant={sessionTheme === theme.value ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSessionTheme(theme.value)}
                  >
                    {theme.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Number of Rolls */}
            <div className="space-y-2">
              <Label htmlFor="rolls">Number of Rolls</Label>
              <Input
                id="rolls"
                type="number"
                min="0"
                value={rolls}
                onChange={(e) => setRolls(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Enter number of rolls"
              />
            </div>

            {/* Mood Indicator Slider */}
            <div className="space-y-3">
              <Label>How did you feel?</Label>
              <div className="space-y-2">
                <Slider
                  value={[moodRating]}
                  onValueChange={(value) => setMoodRating(value[0])}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {MOOD_LABELS.map((label, idx) => (
                    <span
                      key={label}
                      className={cn(
                        'transition-colors',
                        Math.abs(moodRating - idx / (MOOD_LABELS.length - 1)) < 0.15 && 'text-foreground font-semibold'
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-lg font-semibold text-primary">{getMoodLabel(moodRating)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addMutation.isPending || saveMutation.isPending}
                className="bg-gradient-to-r from-bjj-blue to-bjj-purple hover:from-bjj-blue/90 hover:to-bjj-purple/90"
              >
                {(addMutation.isPending || saveMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingSession ? (
                  'Update Session'
                ) : (
                  'Log Session'
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
