import { Intensity } from '../backend';

export const INTENSITY_OPTIONS: { value: Intensity; label: string; shortCode: string }[] = [
  { value: Intensity.recoveryFlow, label: 'Recovery / Flow', shortCode: 'RF' },
  { value: Intensity.light, label: 'Light', shortCode: 'L' },
  { value: Intensity.moderate, label: 'Moderate', shortCode: 'M' },
  { value: Intensity.hard, label: 'Hard', shortCode: 'H' },
  { value: Intensity.maxComp, label: 'Max / Comp', shortCode: 'MC' },
];

export function getIntensityLabel(intensity: Intensity): string {
  const option = INTENSITY_OPTIONS.find((opt) => opt.value === intensity);
  return option?.label || 'Moderate';
}

export function getIntensityShortCode(intensity: Intensity): string {
  const option = INTENSITY_OPTIONS.find((opt) => opt.value === intensity);
  return option?.shortCode || 'M';
}

export function getIntensityBadgeColor(intensity: Intensity): string {
  switch (intensity) {
    case Intensity.recoveryFlow:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case Intensity.light:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case Intensity.moderate:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case Intensity.hard:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case Intensity.maxComp:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

// Numeric mapping for intensity (for averaging and charting)
export function intensityToNumeric(intensity: Intensity): number {
  switch (intensity) {
    case Intensity.recoveryFlow:
      return 1;
    case Intensity.light:
      return 2;
    case Intensity.moderate:
      return 3;
    case Intensity.hard:
      return 4;
    case Intensity.maxComp:
      return 5;
    default:
      return 3;
  }
}

// Convert numeric value back to nearest intensity label
export function numericToIntensityLabel(value: number): string {
  if (value <= 1.5) return 'Recovery / Flow';
  if (value <= 2.5) return 'Light';
  if (value <= 3.5) return 'Moderate';
  if (value <= 4.5) return 'Hard';
  return 'Max / Comp';
}
