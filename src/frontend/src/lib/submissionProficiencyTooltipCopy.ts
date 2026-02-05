type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black';

/**
 * Exact tooltip text for Submission Proficiency metric per belt.
 * Format: "Unique submissions for [Belt Name]. Target: [number]. Counts only on: Blue Belt and higher."
 */
export const SUBMISSION_PROFICIENCY_TOOLTIPS: Record<BeltLevel, string> = {
  white: 'Unique submissions for White Belt. Target: 5. Counts only on: Blue Belt and higher.',
  blue: 'Unique submissions for Blue Belt. Target: 25. Counts only on: Blue Belt and higher.',
  purple: 'Unique submissions for Purple Belt. Target: 40. Counts only on: Blue Belt and higher.',
  brown: 'Unique submissions for Brown Belt. Target: 60. Counts only on: Blue Belt and higher.',
  black: 'Unique submissions for Black Belt. Target: 80. Counts only on: Blue Belt and higher.',
};

/**
 * Get the exact Submission Proficiency tooltip text for a given belt.
 */
export function getSubmissionProficiencyTooltip(belt: BeltLevel): string {
  return SUBMISSION_PROFICIENCY_TOOLTIPS[belt];
}
