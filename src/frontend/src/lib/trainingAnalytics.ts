import { TrainingSession, SessionTheme, SubmissionLog } from '../backend';
import { formatSessionTheme } from './formatters';
import { intensityToNumeric, numericToIntensityLabel } from './intensityUtils';
import { startOfWeek, startOfMonth, format, parseISO } from 'date-fns';

// Safe duration to hours conversion
export function durationToHours(durationMinutes: bigint): number {
  return Number(durationMinutes) / 60;
}

// Calculate favorite theme from sessions
export function calculateFavoriteTheme(sessions: TrainingSession[]): string {
  if (sessions.length === 0) return 'N/A';

  const themeCounts: Record<string, number> = {};
  sessions.forEach((session) => {
    const themeLabel = formatSessionTheme(session.sessionTheme);
    themeCounts[themeLabel] = (themeCounts[themeLabel] || 0) + 1;
  });

  const entries = Object.entries(themeCounts);
  if (entries.length === 0) return 'N/A';

  const [favoriteTheme] = entries.reduce((max, current) =>
    current[1] > max[1] ? current : max
  );

  return favoriteTheme;
}

// Calculate average intensity from sessions
export function calculateAverageIntensity(sessions: TrainingSession[]): string {
  if (sessions.length === 0) return 'N/A';

  const total = sessions.reduce((sum, session) => {
    return sum + intensityToNumeric(session.intensity);
  }, 0);

  const average = total / sessions.length;
  return numericToIntensityLabel(average);
}

// Count unique submissions across all belt levels (blue and above)
export function countUniqueSubmissions(submissionLog: SubmissionLog): number {
  const uniqueNames = new Set<string>();

  // Only count blue belt and above
  [...submissionLog.blueBelt, ...submissionLog.purpleBelt, ...submissionLog.brownBelt, ...submissionLog.blackBelt].forEach(
    (entry) => {
      uniqueNames.add(entry.name.toLowerCase().trim());
    }
  );

  return uniqueNames.size;
}

// Time bucketing helpers
export interface TimeBucket {
  label: string;
  startDate: Date;
  endDate: Date;
}

export function bucketSessionsByWeek(sessions: TrainingSession[], numWeeks: number = 12): TimeBucket[] {
  const now = new Date();
  const buckets: TimeBucket[] = [];

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7 - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    buckets.push({
      label: format(weekStart, 'MMM d'),
      startDate: weekStart,
      endDate: weekEnd,
    });
  }

  return buckets;
}

export function bucketSessionsByMonth(sessions: TrainingSession[], numMonths: number = 6): TimeBucket[] {
  const now = new Date();
  const buckets: TimeBucket[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    buckets.push({
      label: format(monthStart, 'MMM yyyy'),
      startDate: monthStart,
      endDate: monthEnd,
    });
  }

  return buckets;
}

// Calculate average rolls per session over time
export function calculateAverageRollsPerBucket(
  sessions: TrainingSession[],
  buckets: TimeBucket[]
): { label: string; avgRolls: number }[] {
  return buckets.map((bucket) => {
    const bucketSessions = sessions.filter((s) => {
      const sessionDate = new Date(Number(s.date) / 1000000);
      return sessionDate >= bucket.startDate && sessionDate <= bucket.endDate;
    });

    const avgRolls =
      bucketSessions.length > 0
        ? bucketSessions.reduce((sum, s) => sum + Number(s.rolls), 0) / bucketSessions.length
        : 0;

    return {
      label: bucket.label,
      avgRolls: Math.round(avgRolls * 10) / 10, // Round to 1 decimal
    };
  });
}

// Calculate average intensity over time
export function calculateAverageIntensityPerBucket(
  sessions: TrainingSession[],
  buckets: TimeBucket[]
): { label: string; avgIntensity: number }[] {
  return buckets.map((bucket) => {
    const bucketSessions = sessions.filter((s) => {
      const sessionDate = new Date(Number(s.date) / 1000000);
      return sessionDate >= bucket.startDate && sessionDate <= bucket.endDate;
    });

    const avgIntensity =
      bucketSessions.length > 0
        ? bucketSessions.reduce((sum, s) => sum + intensityToNumeric(s.intensity), 0) /
          bucketSessions.length
        : 0;

    return {
      label: bucket.label,
      avgIntensity: Math.round(avgIntensity * 10) / 10, // Round to 1 decimal
    };
  });
}

// Calculate training volume (hours or sessions) per bucket
export function calculateVolumePerBucket(
  sessions: TrainingSession[],
  buckets: TimeBucket[],
  mode: 'hours' | 'sessions'
): { label: string; value: number }[] {
  return buckets.map((bucket) => {
    const bucketSessions = sessions.filter((s) => {
      const sessionDate = new Date(Number(s.date) / 1000000);
      return sessionDate >= bucket.startDate && sessionDate <= bucket.endDate;
    });

    const value =
      mode === 'sessions'
        ? bucketSessions.length
        : Math.round(
            bucketSessions.reduce((sum, s) => sum + durationToHours(s.duration), 0) * 10
          ) / 10;

    return {
      label: bucket.label,
      value,
    };
  });
}

// Mood vs Intensity correlation data
export function calculateMoodIntensityCorrelation(
  sessions: TrainingSession[]
): { mood: number; intensity: number; id: string }[] {
  return sessions.map((session) => ({
    mood: session.moodRating,
    intensity: intensityToNumeric(session.intensity),
    id: session.id,
  }));
}
