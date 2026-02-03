import { useState } from 'react';
import { useGetTrainingRecords, useAddTrainingRecord, useSaveTrainingRecords } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, Trash2, Edit2, ChevronDown, ChevronUp, Activity, Target, Smile } from 'lucide-react';
import { format } from 'date-fns';
import AddTrainingDialog from './AddTrainingDialog';
import { TrainingSession, SessionTheme } from '../backend';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SubmissionLogSection from './SubmissionLogSection';

const SESSION_THEME_LABELS: Record<SessionTheme, string> = {
  [SessionTheme.takedowns_standup]: 'Takedowns / Stand-up',
  [SessionTheme.guardSystems]: 'Guard Systems',
  [SessionTheme.guardRetention]: 'Guard Retention',
  [SessionTheme.guardPassing]: 'Guard Passing',
  [SessionTheme.sweeps]: 'Sweeps',
  [SessionTheme.pinsControl]: 'Pins & Control',
  [SessionTheme.backControl]: 'Back Control',
  [SessionTheme.escapes]: 'Escapes',
  [SessionTheme.submissions]: 'Submissions',
  [SessionTheme.legLocks]: 'Leg Locks',
  [SessionTheme.transitionsScrambles]: 'Transitions & Scrambles',
  [SessionTheme.turtleGame]: 'Turtle Game',
  [SessionTheme.openMat]: 'Open Mat',
};

const MOOD_LABELS = ['Tough', 'Hard', 'Okay', 'Good', 'Great'];

export default function TrainingLog() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const { data: sessions = [], isLoading } = useGetTrainingRecords();
  const addMutation = useAddTrainingRecord();
  const saveMutation = useSaveTrainingRecords();

  const sortedSessions = [...sessions].sort((a, b) => Number(b.date - a.date));

  const handleDelete = () => {
    if (!deletingSessionId) return;

    const updatedSessions = sessions.filter((s) => s.id !== deletingSessionId);
    saveMutation.mutate(updatedSessions);
    setDeletingSessionId(null);
  };

  const handleEdit = (session: TrainingSession) => {
    setEditingSession(session);
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingSession(null);
  };

  const toggleExpanded = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const getMoodLabel = (rating: number): string => {
    const index = Math.round(rating * (MOOD_LABELS.length - 1));
    return MOOD_LABELS[Math.max(0, Math.min(index, MOOD_LABELS.length - 1))];
  };

  // Analytics calculations
  const totalSessions = sessions.length;

  // Session theme frequency
  const themeCounts: Record<string, number> = {};
  sessions.forEach((session) => {
    const themeLabel = SESSION_THEME_LABELS[session.sessionTheme];
    themeCounts[themeLabel] = (themeCounts[themeLabel] || 0) + 1;
  });
  const topThemes = Object.entries(themeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Weekly activity (last 4 weeks) - using local time
  const now = new Date();
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (3 - i) * 7 - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekSessions = sessions.filter((s) => {
      const sessionDate = new Date(Number(s.date) / 1000000);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
    
    return {
      week: format(weekStart, 'MMM d'),
      sessions: weekSessions.length,
      hours: Math.round(weekSessions.reduce((sum, s) => sum + Number(s.duration), 0) / 60),
    };
  });

  const COLORS = ['oklch(var(--chart-1))', 'oklch(var(--chart-2))', 'oklch(var(--chart-3))', 'oklch(var(--chart-4))', 'oklch(var(--chart-5))'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading training sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Training Log</h2>
          <p className="text-muted-foreground">Record and track your training sessions</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-bjj-blue to-bjj-purple hover:from-bjj-blue/90 hover:to-bjj-purple/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Log Session
        </Button>
      </div>

      {sortedSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No training sessions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start logging your training to track your progress</p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Log Your First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Recent Sessions Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Recent Sessions</h3>

            <div className="grid gap-3">
              {sortedSessions.map((session) => {
                const isExpanded = expandedSessions.has(session.id);
                // Parse date in local time
                const sessionDate = new Date(Number(session.date) / 1000000);
                
                return (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(session.id)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(sessionDate, 'MMM d, yyyy')}
                              </CardTitle>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(session);
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingSessionId(session.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Number(session.duration)}m
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {session.trainingType === 'gi' ? 'Gi' : 'No-Gi'}
                              </Badge>
                              <span className="text-xs">
                                {SESSION_THEME_LABELS[session.sessionTheme]}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-center py-2 h-auto">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Show Details
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Number of Rolls</p>
                              <p className="text-2xl font-bold">{Number(session.rolls)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Mood</p>
                              <div className="flex items-center gap-2">
                                <Smile className="h-5 w-5 text-muted-foreground" />
                                <p className="text-lg font-semibold">{getMoodLabel(session.moodRating)}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Submission Log Section - Now separate below Recent Sessions */}
          <div className="space-y-4">
            <SubmissionLogSection />
          </div>

          {/* Analytics Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Training Analytics</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSessions}</div>
                  <p className="text-xs text-muted-foreground">Training sessions logged</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Session Themes</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(themeCounts).length}</div>
                  <p className="text-xs text-muted-foreground">Different themes practiced</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Training sessions over the last 4 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeks}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'oklch(var(--card))',
                          border: '1px solid oklch(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="sessions" fill="oklch(var(--chart-1))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Theme Frequency</CardTitle>
                  <CardDescription>Your most practiced session themes</CardDescription>
                </CardHeader>
                <CardContent>
                  {topThemes.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={topThemes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {topThemes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(var(--card))',
                            border: '1px solid oklch(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">No session themes recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <AddTrainingDialog
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        editingSession={editingSession}
      />

      <AlertDialog open={!!deletingSessionId} onOpenChange={() => setDeletingSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
