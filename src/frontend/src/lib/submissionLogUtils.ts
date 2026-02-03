import type { SubmissionCount } from '../backend';

/**
 * Normalize a submission name: trim whitespace and convert to lowercase
 */
export function normalizeSubmissionName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Check if a submission already exists in a belt grouping (case-insensitive)
 */
export function submissionExists(
  submissions: SubmissionCount[],
  name: string
): boolean {
  const normalized = normalizeSubmissionName(name);
  return submissions.some(
    (sub) => normalizeSubmissionName(sub.name) === normalized
  );
}

/**
 * Find a submission by name (case-insensitive)
 */
export function findSubmission(
  submissions: SubmissionCount[],
  name: string
): SubmissionCount | undefined {
  const normalized = normalizeSubmissionName(name);
  return submissions.find(
    (sub) => normalizeSubmissionName(sub.name) === normalized
  );
}

/**
 * Add a submission to a belt grouping, incrementing count if it already exists
 */
export function addSubmission(
  submissions: SubmissionCount[],
  name: string
): SubmissionCount[] {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return submissions;
  }

  const existing = findSubmission(submissions, trimmedName);
  
  if (existing) {
    // Increment existing submission count
    return submissions.map((sub) =>
      normalizeSubmissionName(sub.name) === normalizeSubmissionName(trimmedName)
        ? { ...sub, count: sub.count + 1n }
        : sub
    );
  } else {
    // Add new submission with count 1
    return [...submissions, { name: trimmedName, count: 1n }];
  }
}

/**
 * Remove a submission from a belt grouping
 */
export function removeSubmission(
  submissions: SubmissionCount[],
  name: string
): SubmissionCount[] {
  const normalized = normalizeSubmissionName(name);
  return submissions.filter(
    (sub) => normalizeSubmissionName(sub.name) !== normalized
  );
}

/**
 * Increment the count of a submission
 */
export function incrementSubmission(
  submissions: SubmissionCount[],
  name: string
): SubmissionCount[] {
  const normalized = normalizeSubmissionName(name);
  return submissions.map((sub) =>
    normalizeSubmissionName(sub.name) === normalized
      ? { ...sub, count: sub.count + 1n }
      : sub
  );
}

/**
 * Decrement the count of a submission, removing it if count reaches 0
 */
export function decrementSubmission(
  submissions: SubmissionCount[],
  name: string
): SubmissionCount[] {
  const normalized = normalizeSubmissionName(name);
  return submissions
    .map((sub) =>
      normalizeSubmissionName(sub.name) === normalized
        ? { ...sub, count: sub.count - 1n }
        : sub
    )
    .filter((sub) => sub.count > 0n);
}

/**
 * Merge duplicate submissions (case-insensitive) within a belt grouping
 */
export function mergeDuplicates(
  submissions: SubmissionCount[]
): SubmissionCount[] {
  const merged = new Map<string, SubmissionCount>();

  for (const sub of submissions) {
    const normalized = normalizeSubmissionName(sub.name);
    const existing = merged.get(normalized);

    if (existing) {
      merged.set(normalized, {
        name: existing.name, // Keep the first casing encountered
        count: existing.count + sub.count,
      });
    } else {
      merged.set(normalized, sub);
    }
  }

  return Array.from(merged.values());
}
