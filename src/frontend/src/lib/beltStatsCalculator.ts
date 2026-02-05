import type { TrainingSession, SubmissionLog } from '../backend';

type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black';
type SessionTheme = 'takedowns_standup' | 'guardSystems' | 'guardRetention' | 'guardPassing' | 'sweeps' | 'pinsControl' | 'backControl' | 'escapes' | 'submissions' | 'legLocks' | 'transitionsScrambles' | 'turtleGame' | 'openMat';

export interface BeltGamifiedStats {
  progressionPercent: number;
  experiencePercent: number;
  submissionProficiencyPercent: number;
  techniqueMasteryPercent: number;
  progressionRaw: {
    stripes: number;
    hours: number;
    milestoneBonus: number;
  };
  experienceRaw: {
    hours: number;
  };
  submissionsRaw: {
    totalCount: number;
  };
  masteryRaw: {
    totalSessions: number;
    themeCounts: Record<string, number>;
  };
}

const SUBMISSION_THRESHOLDS: Record<string, number> = {
  white: 5,
  blue: 25,
  purple: 40,
  brown: 60,
  black: 80,
};

const ALL_THEMES: SessionTheme[] = [
  'takedowns_standup',
  'guardSystems',
  'guardRetention',
  'guardPassing',
  'sweeps',
  'pinsControl',
  'backControl',
  'escapes',
  'submissions',
  'legLocks',
  'transitionsScrambles',
  'turtleGame',
  'openMat',
];

export function calculateBeltGamifiedStats(
  currentBelt: BeltLevel,
  currentStripes: number,
  trainingSessions: TrainingSession[],
  submissionLog: SubmissionLog
): BeltGamifiedStats {
  // Filter sessions for current belt
  const currentBeltSessions = trainingSessions.filter(
    (session) => session.beltSnapshot.belt === currentBelt
  );

  // Calculate hours at current belt
  const hoursAtBelt = currentBeltSessions.reduce((total, session) => {
    return total + Number(session.duration) / 60; // Convert minutes to hours
  }, 0);

  // 1. Progression Calculation
  const baseProgression = currentStripes * 20; // 20% per stripe
  const milestones = [150, 300, 450, 600];
  let milestoneBonus = 0;
  for (const milestone of milestones) {
    if (hoursAtBelt >= milestone) {
      milestoneBonus += 5;
    }
  }
  const progressionPercent = Math.min(100, baseProgression + milestoneBonus);

  // 2. Experience Calculation (power curve)
  const experiencePercent = Math.min(100, Math.pow(hoursAtBelt / 600, 0.6) * 100);

  // 3. Submission Proficiency Calculation
  // Count unique submissions for the current belt only
  let currentBeltSubmissions: Array<{ name: string; count: bigint }> = [];
  
  switch (currentBelt) {
    case 'white':
      currentBeltSubmissions = submissionLog.whiteBelt || [];
      break;
    case 'blue':
      currentBeltSubmissions = submissionLog.blueBelt || [];
      break;
    case 'purple':
      currentBeltSubmissions = submissionLog.purpleBelt || [];
      break;
    case 'brown':
      currentBeltSubmissions = submissionLog.brownBelt || [];
      break;
    case 'black':
      currentBeltSubmissions = submissionLog.blackBelt || [];
      break;
  }

  // Count unique submissions (not total count)
  const uniqueSubmissionCount = currentBeltSubmissions.length;

  const threshold = SUBMISSION_THRESHOLDS[currentBelt] || 0;
  const submissionProficiencyPercent = threshold > 0 ? Math.min(100, (uniqueSubmissionCount / threshold) * 100) : 0;

  // 4. Technique Mastery Calculation
  const themeCounts: Record<string, number> = {};
  ALL_THEMES.forEach((theme) => {
    themeCounts[theme] = 0;
  });

  currentBeltSessions.forEach((session) => {
    const theme = session.sessionTheme as SessionTheme;
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  });

  // Each theme contributes 7.69% (1/13) to total
  // Progress per theme = min(sessionCount / 20, 1.0) * 7.69
  let techniqueMasteryPercent = 0;
  ALL_THEMES.forEach((theme) => {
    const sessionCount = themeCounts[theme] || 0;
    const themeProgress = Math.min(sessionCount / 20, 1.0) * (100 / 13);
    techniqueMasteryPercent += themeProgress;
  });
  techniqueMasteryPercent = Math.min(100, techniqueMasteryPercent);

  return {
    progressionPercent,
    experiencePercent,
    submissionProficiencyPercent,
    techniqueMasteryPercent,
    progressionRaw: {
      stripes: currentStripes,
      hours: hoursAtBelt,
      milestoneBonus,
    },
    experienceRaw: {
      hours: hoursAtBelt,
    },
    submissionsRaw: {
      totalCount: uniqueSubmissionCount,
    },
    masteryRaw: {
      totalSessions: currentBeltSessions.length,
      themeCounts,
    },
  };
}
