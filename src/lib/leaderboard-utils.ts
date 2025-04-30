import type { Contestant, ProblemKey, ProblemSubmission } from '@/types/contestant';
import { PROBLEM_KEYS } from '@/types/contestant';

/**
 * Calculates the overall score for a contestant based on individual problem scores.
 */
export function calculateOverallScore(contestant: Omit<Contestant, 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent' | 'rank' | 'countryFlagUrl'>): number {
  return PROBLEM_KEYS.reduce((total, key) => {
    const score = contestant[key].score;
    return total + (score ?? 0);
  }, 0);
}

/**
 * Calculates the overall penalty time for a contestant.
 * Assumes penalty is only added for solved problems (score > 0).
 * You might adjust this logic based on specific contest rules (e.g., penalty for wrong submissions).
 */
export function calculateOverallTime(contestant: Omit<Contestant, 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent' | 'rank' | 'countryFlagUrl'>): number {
    return PROBLEM_KEYS.reduce((total, key) => {
      const submission = contestant[key];
      // Only add time penalty if the problem is considered solved (score > 0)
      if (submission.score !== null && submission.score > 0 && submission.timeTaken !== null) {
        return total + submission.timeTaken;
      }
      return total;
    }, 0);
}


/**
 * Calculates the average system test pass percentage across submitted problems.
 */
export function calculateOverallSystemTestsPassedPercent(contestant: Omit<Contestant, 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent' | 'rank' | 'countryFlagUrl'>): number {
  let totalPercent = 0;
  let submittedProblems = 0;

  PROBLEM_KEYS.forEach(key => {
    const percent = contestant[key].systemTestsPassedPercent;
    if (percent !== null) {
      totalPercent += percent;
      submittedProblems++;
    }
  });

  return submittedProblems > 0 ? Math.round(totalPercent / submittedProblems) : 0;
}


/**
 * Sorts contestants based on standard competitive programming rules:
 * 1. Higher score is better.
 * 2. Lower penalty time is better (for ties in score).
 * 3. Lower average system test pass percentage is better (for ties in score and time - optional, might vary).
 * 4. Alphabetical by username (final tiebreaker).
 */
export function sortContestants(a: Contestant, b: Contestant): number {
  // Sort by score descending
  if (b.overallScore !== a.overallScore) {
    return b.overallScore - a.overallScore;
  }

  // Sort by time ascending (lower is better)
  if (a.overallTime !== b.overallTime) {
    return a.overallTime - b.overallTime;
  }

   // Optional: Sort by system tests passed percentage ascending (lower might indicate faster correct solution) - adjust if needed
   if(a.overallSystemTestsPassedPercent !== b.overallSystemTestsPassedPercent) {
     // Consider higher percentage better? Or lower time for same score implies efficiency?
     // Let's assume higher percentage is generally better for a tie breaker after time.
     // return b.overallSystemTestsPassedPercent - a.overallSystemTestsPassedPercent;
     // If lower % is better (less failed tests to get score), uncomment below:
     // return a.overallSystemTestsPassedPercent - b.overallSystemTestsPassedPercent;
   }


  // Final tiebreaker: Sort by username ascending
  return a.userName.localeCompare(b.userName);
}

/**
 * Updates the ranks of contestants in a sorted list.
 * Mutates the array in place.
 */
export function updateRanks(contestants: Contestant[]): Contestant[] {
    // First, sort the contestants
    const sortedContestants = [...contestants].sort(sortContestants);

    // Then, update ranks based on the sorted order
    return sortedContestants.map((contestant, index) => ({
        ...contestant,
        rank: index + 1,
    }));
}

/**
 * Recalculates derived fields (score, time, %) and sorts/ranks the list.
 */
export function recalculateAndRank(contestants: Contestant[]): Contestant[] {
    const recalculated = contestants.map(c => {
        const overallScore = calculateOverallScore(c);
        const overallTime = calculateOverallTime(c);
        const overallSystemTestsPassedPercent = calculateOverallSystemTestsPassedPercent(c);
        return { ...c, overallScore, overallTime, overallSystemTestsPassedPercent };
    });
    return updateRanks(recalculated);
}
