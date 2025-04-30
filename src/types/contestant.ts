/**
 * Represents a submission for a single problem.
 */
export interface ProblemSubmission {
  score: number | null; // Points awarded (null if not attempted/solved)
  timeTaken: number | null; // Time in seconds (null if not attempted/solved)
  systemTestsPassedPercent: number | null; // Percentage (0-100, null if not submitted)
}

/**
 * Represents a contestant's data.
 */
export interface Contestant {
  id: string; // Unique identifier
  rank: number;
  userName: string;
  country: string; // Country name
  countryFlagUrl?: string; // Optional URL to country flag
  problemA: ProblemSubmission;
  problemB: ProblemSubmission;
  problemC: ProblemSubmission;
  problemD: ProblemSubmission;
  problemE: ProblemSubmission;
  overallScore: number;
  overallTime: number; // Total penalty time in seconds
  overallSystemTestsPassedPercent: number; // Average percentage across submitted problems
}

/**
 * Input data for updating a contestant's details.
 * All fields are optional for partial updates.
 */
export interface ContestantUpdateInput {
  userName: string; // Required to identify the contestant
  problemA?: Partial<ProblemSubmission>;
  problemB?: Partial<ProblemSubmission>;
  problemC?: Partial<ProblemSubmission>;
  problemD?: Partial<ProblemSubmission>;
  problemE?: Partial<ProblemSubmission>;
}

// Helper type for problem keys
export type ProblemKey = 'problemA' | 'problemB' | 'problemC' | 'problemD' | 'problemE';

export const PROBLEM_KEYS: ProblemKey[] = ['problemA', 'problemB', 'problemC', 'problemD', 'problemE'];
