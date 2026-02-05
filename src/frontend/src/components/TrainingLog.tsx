import { useState } from 'react';
import { useGetTrainingRecords } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Activity, Target } from 'lucide-react';
import AddTrainingDialog from './AddTrainingDialog';
import { TrainingSession, TrainingType } from '../backend';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from 'recharts';
import SubmissionLogSection from './SubmissionLogSection';
import TrainingMonthCalendar from './TrainingMonthCalendar';
import { formatSessionTheme } from '../lib/formatters';
import {
  bucketSessionsByWeek,
  bucketSessionsByMonth,
  calculateAverageRollsPerBucket,
  calculateAverageIntensityPerBucket,
  calculateVolumePerBucket,
  calculateMoodIntensityCorrelation,
} from '../lib/trainingAnalytics';

export default function TrainingLog() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [volumeTimeframe, setVolumeTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [volumeMetric, setVolumeMetric] = useState<'hours' | 'sessions'>('hours');

  const { data: sessions = [], isLoading } = useGetTrainingRecords();

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingSession(null);
  };

  const handleEditSession = (session: TrainingSession) => {
    setEditingSession(session);
    setIsAddDialogOpen(true);
  };

  // Analytics calculations
  const totalSessions = sessions.length;

  // 1. Gi vs No-Gi Ratio
  const giCount = sessions.filter((s) => s.trainingType === TrainingType.gi).length;
  const noGiCount = sessions.filter((s) => s.trainingType === TrainingType.noGi).length;
  const giNoGiData = [
    { name: 'Gi', value: giCount },
    { name: 'No-Gi', value: noGiCount },
  ];

  // 2. Session Theme Frequency
  const themeCounts: Record<string, number> = {};
  sessions.forEach((session) => {
    const themeLabel = formatSessionTheme(session.sessionTheme);
    themeCounts[themeLabel] = (themeCounts[themeLabel] || 0) + 1;
  });
  const themeData = Object.entries(themeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // 3. Average Rolls per Session (trend over time)
  const rollsBuckets = bucketSessionsByWeek(sessions, 12);
  const rollsTrendData = calculateAverageRollsPerBucket(sessions, rollsBuckets);

  // 4. Intensity Trends Over Time
  const intensityBuckets = bucketSessionsByWeek(sessions, 12);
  const intensityTrendData = calculateAverageIntensityPerBucket(sessions, intensityBuckets);

  // 5. Mood vs Intensity Correlation
  const moodIntensityData = calculateMoodIntensityCorrelation(sessions);

  // 6. Weekly / Monthly Training Volume
  const volumeBuckets =
    volumeTimeframe === 'weekly'
      ? bucketSessionsByWeek(sessions, 12)
      : bucketSessionsByMonth(sessions, 6);
  const volumeData = calculateVolumePerBucket(sessions, volumeBuckets, volumeMetric);

  const COLORS = [
    'oklch(var(--chart-1))',
    'oklch(var(--chart-2))',
    'oklch(var(--chart-3))',
    'oklch(var(--chart-4))',
    'oklch(var(--chart-5))',
  ];

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

      {/* Month Calendar View */}
      <TrainingMonthCalendar sessions={sessions} onEditSession={handleEditSession} />

      {/* Submission Log Section - Always visible */}
      <div className="space-y-4">
        <SubmissionLogSection />
      </div>

      {/* Analytics Section - Always visible */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Training Analytics</h3>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. Gi vs No-Gi Ratio */}
          <Card>
            <CardHeader>
              <CardTitle>Gi vs No-Gi Ratio</CardTitle>
              <CardDescription>Distribution of training types</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-muted-foreground">No training sessions yet.</p>
                </div>
              ) : giCount + noGiCount === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-muted-foreground">No training type data available.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={giNoGiData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {giNoGiData.map((entry, index) => (
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
              )}
            </CardContent>
          </Card>

          {/* 2. Session Theme Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Session Theme Frequency</CardTitle>
              <CardDescription>Distribution of themes practiced</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-muted-foreground">No training sessions yet.</p>
                </div>
              ) : themeData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-muted-foreground">No theme data available.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={themeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {themeData.map((entry, index) => (
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
              )}
            </CardContent>
          </Card>

          {/* 3. Average Rolls per Session */}
          <Card>
            <CardHeader>
              <CardTitle>Average Rolls per Session</CardTitle>
              <CardDescription>Trend over the last 12 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-muted-foreground">No training sessions yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rollsTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(var(--card))',
                        border: '1px solid oklch(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgRolls"
                      stroke="oklch(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: 'oklch(var(--chart-1))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 4. Intensity Trends Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Intensity Trends Over Time</CardTitle>
              <CardDescription>Average intensity over the last 12 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-muted-foreground">No training sessions yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={intensityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis domain={[0, 6]} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(var(--card))',
                        border: '1px solid oklch(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgIntensity"
                      stroke="oklch(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: 'oklch(var(--chart-2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 5. Mood vs Intensity Correlation */}
          <Card>
            <CardHeader>
              <CardTitle>Mood vs Intensity Correlation</CardTitle>
              <CardDescription>How intensity affects mood rating</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-muted-foreground">No training sessions yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      dataKey="intensity"
                      name="Intensity"
                      domain={[0, 6]}
                      className="text-xs"
                      label={{ value: 'Intensity', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="mood"
                      name="Mood"
                      domain={[0, 1]}
                      className="text-xs"
                      label={{ value: 'Mood', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: 'oklch(var(--card))',
                        border: '1px solid oklch(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Scatter
                      name="Sessions"
                      data={moodIntensityData}
                      fill="oklch(var(--chart-3))"
                      opacity={0.6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 6. Weekly / Monthly Training Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Training Volume</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={volumeTimeframe === 'weekly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVolumeTimeframe('weekly')}
                    >
                      Weekly
                    </Button>
                    <Button
                      variant={volumeTimeframe === 'monthly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVolumeTimeframe('monthly')}
                    >
                      Monthly
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={volumeMetric === 'hours' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVolumeMetric('hours')}
                    >
                      Hours
                    </Button>
                    <Button
                      variant={volumeMetric === 'sessions' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVolumeMetric('sessions')}
                    >
                      Sessions
                    </Button>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-muted-foreground">No training sessions yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(var(--card))',
                        border: '1px solid oklch(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="oklch(var(--chart-4))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddTrainingDialog
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        editingSession={editingSession}
      />
    </div>
  );
}
