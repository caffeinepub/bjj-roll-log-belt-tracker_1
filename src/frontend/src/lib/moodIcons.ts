/**
 * Centralized mood icon helper that maps mood rating values to canonical generated asset paths
 * with lowercase .png filenames derived from mood labels.
 */

const MOOD_LABELS = ['Tough', 'Hard', 'Okay', 'Good', 'Great'];

interface MoodIcon {
  src: string;
  alt: string;
}

/**
 * Get the mood icon for a given mood rating (0-1 scale)
 * Returns a safe fallback if the rating is invalid
 */
export function getMoodIcon(rating: number): MoodIcon {
  // Validate rating
  if (typeof rating !== 'number' || isNaN(rating)) {
    return { src: '/assets/generated/okay.png', alt: 'Okay' };
  }

  // Clamp rating to 0-1 range
  const clampedRating = Math.max(0, Math.min(1, rating));
  
  // Map rating to mood label index
  const index = Math.round(clampedRating * (MOOD_LABELS.length - 1));
  const safeIndex = Math.max(0, Math.min(index, MOOD_LABELS.length - 1));
  const label = MOOD_LABELS[safeIndex];
  
  // Convert label to lowercase filename
  const filename = `${label.toLowerCase()}.png`;

  return {
    src: `/assets/generated/${filename}`,
    alt: label,
  };
}

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
 * Get all available mood icons
 */
export function getAllMoodIcons(): MoodIcon[] {
  return MOOD_LABELS.map((label) => ({
    src: `/assets/generated/${label.toLowerCase()}.png`,
    alt: label,
  }));
}
