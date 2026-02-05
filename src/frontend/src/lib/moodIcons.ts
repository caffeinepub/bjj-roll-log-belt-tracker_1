/**
 * Centralized mood label and color mapping from 0-1 moodRating scale.
 * Provides utilities to derive mood labels and exact hex colors without referencing image paths.
 */

const MOOD_LABELS = ['Tough', 'Hard', 'Okay', 'Good', 'Great'];

// Exact hex colors for each mood label
const MOOD_COLORS: Record<string, string> = {
  'Tough': '#d51818',
  'Hard': '#ff5f2f',
  'Okay': '#f9a217',
  'Good': '#f0dc04',
  'Great': '#74d601',
};

/**
 * Get the mood label for a given mood rating (0-1 scale)
 */
export function getMoodLabel(rating: number): string {
  if (typeof rating !== 'number' || isNaN(rating)) {
    return 'Okay';
  }

  const clampedRating = Math.max(0, Math.min(1, rating));
  const index = Math.round(clampedRating * (MOOD_LABELS.length - 1));
  return MOOD_LABELS[Math.max(0, Math.min(index, MOOD_LABELS.length - 1))];
}

/**
 * Get the mood color (hex) for a given mood rating (0-1 scale)
 */
export function getMoodColor(rating: number): string {
  const label = getMoodLabel(rating);
  return MOOD_COLORS[label] || MOOD_COLORS['Okay'];
}

/**
 * Get all mood labels
 */
export function getAllMoodLabels(): string[] {
  return [...MOOD_LABELS];
}

/**
 * Get the mood color for a specific label
 */
export function getMoodColorByLabel(label: string): string {
  return MOOD_COLORS[label] || MOOD_COLORS['Okay'];
}
