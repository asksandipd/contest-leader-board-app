import type { Contestant, ProblemKey } from '@/types/contestant';
import { PROBLEM_KEYS } from '@/types/contestant';
import { calculateOverallScore, calculateOverallTime, calculateOverallSystemTestsPassedPercent, updateRanks, recalculateAndRank } from '@/lib/leaderboard-utils'; // Import recalculateAndRank

const countries = [
  { name: 'USA', flagUrl: '/assets/flags/us.svg' },
  { name: 'Canada', flagUrl: '/assets/flags/ca.svg' },
  { name: 'Mexico', flagUrl: '/assets/flags/mx.svg' },
  { name: 'Brazil', flagUrl: '/assets/flags/br.svg' },
  { name: 'Argentina', flagUrl: '/assets/flags/ar.svg' },
  { name: 'UK', flagUrl: '/assets/flags/gb.svg' },
  { name: 'Germany', flagUrl: '/assets/flags/de.svg' },
  { name: 'France', flagUrl: '/assets/flags/fr.svg' },
  { name: 'Spain', flagUrl: '/assets/flags/es.svg' },
  { name: 'Italy', flagUrl: '/assets/flags/it.svg' },
  { name: 'Russia', flagUrl: '/assets/flags/ru.svg' },
  { name: 'China', flagUrl: '/assets/flags/cn.svg' },
  { name: 'Japan', flagUrl: '/assets/flags/jp.svg' },
  { name: 'South Korea', flagUrl: '/assets/flags/kr.svg' },
  { name: 'India', flagUrl: '/assets/flags/in.svg' },
  { name: 'Australia', flagUrl: '/assets/flags/au.svg' },
  { name: 'Egypt', flagUrl: '/assets/flags/eg.svg' },
  { name: 'South Africa', flagUrl: '/assets/flags/za.svg' },
  { name: 'Nigeria', flagUrl: '/assets/flags/ng.svg' },
  { name: 'Kenya', flagUrl: '/assets/flags/ke.svg' },
  // Add more countries as needed
];

// Function to generate a random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number): number => {
  // This function uses Math.random() and should only be called client-side or
  // where deterministic server-side rendering is not required for this data.
  if (typeof window === 'undefined') {
    // Basic pseudo-random for server-side if needed, less random than Math.random
    // Consider a seed-based generator if consistency is critical server-side
    return min + (Date.now() % (max - min + 1));
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to generate a somewhat realistic username
const generateUserName = (index: number): string => {
  const prefixes = ['coder', 'dev', 'ninja', 'hacker', 'wizard', 'alpha', 'beta', 'gamma'];
  const suffixes = ['pro', 'master', 'guru', 'expert', 'ace', 'king', 'queen'];
  return `${prefixes[getRandomInt(0, prefixes.length - 1)]}_${suffixes[getRandomInt(0, suffixes.length - 1)]}_${index + 1}`;
};

// Generate initial contestant data
const generateInitialContestants = (count: number): Contestant[] => {
  const contestants: Omit<Contestant, 'rank' | 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent'>[] = [];

  for (let i = 0; i < count; i++) {
    const countryInfo = countries[getRandomInt(0, countries.length - 1)];
    const contestantBase = {
      id: `contestant-${i + 1}-${getRandomInt(1000, 9999)}`, // Add random element to ID
      userName: generateUserName(i),
      country: countryInfo.name,
      countryFlagUrl: countryInfo.flagUrl,
    };

    const problemData: Record<ProblemKey, { score: number | null; timeTaken: number | null; systemTestsPassedPercent: number | null }> = {} as any;

    let solvedCount = 0;
    PROBLEM_KEYS.forEach(key => {
       // Decide if the problem is attempted (70% chance)
      if (getRandomInt(1, 10) <= 7) { // Use getRandomInt
           // Decide if the attempt is successful (score > 0) - higher chance for earlier problems
            const problemIndex = PROBLEM_KEYS.indexOf(key);
            const successChance = 0.8 - problemIndex * 0.1; // e.g., 80% for A, 70% for B,...
            const isSolved = getRandomInt(1, 100) <= successChance * 100; // Use getRandomInt

            if(isSolved) {
              solvedCount++;
              const score = getRandomInt(50, 100); // Score if solved
              const timeTaken = getRandomInt(300, 3000); // Time taken if solved (5min to 50min)
              const systemTestsPassedPercent = getRandomInt(80, 100); // High pass rate if solved
               problemData[key] = { score, timeTaken, systemTestsPassedPercent };
            } else {
                // Attempted but not solved (e.g., wrong answer, TLE)
                const score = 0; // Score is 0 if not solved correctly
                const timeTaken = getRandomInt(100, 1800); // Time spent on attempt
                const systemTestsPassedPercent = getRandomInt(0, 70); // Lower pass rate
                problemData[key] = { score, timeTaken, systemTestsPassedPercent };
            }

      } else {
        // Not attempted
        problemData[key] = { score: null, timeTaken: null, systemTestsPassedPercent: null };
      }
    });

    // Ensure at least one problem is solved for variety, unless it's the very beginning
    if (solvedCount === 0 && i > 10 && getRandomInt(1, 10) <= 5) { // Use getRandomInt
        const randomProblem = PROBLEM_KEYS[getRandomInt(0, PROBLEM_KEYS.length - 1)];
        problemData[randomProblem] = {
            score: getRandomInt(50, 100),
            timeTaken: getRandomInt(300, 3000),
            systemTestsPassedPercent: getRandomInt(80, 100)
        };
    }


    contestants.push({ ...contestantBase, ...problemData });
  }

   // Calculate derived fields and initial rank
   const fullContestants = contestants.map(c => {
     const overallScore = calculateOverallScore(c);
     const overallTime = calculateOverallTime(c);
     const overallSystemTestsPassedPercent = calculateOverallSystemTestsPassedPercent(c);
     return { ...c, overallScore, overallTime, overallSystemTestsPassedPercent, rank: 0 }; // Initialize rank to 0
   });


  return updateRanks(fullContestants); // Calculate initial ranks after scores/times are set
};


export const initialContestants: Contestant[] = generateInitialContestants(50); // Reduced initial count for faster load


// --- Simulation Logic ---

/**
 * Simulates an update event for a random contestant.
 * IMPORTANT: This function uses Math.random() and should only be called client-side.
 */
export function simulateUpdate(currentContestants: Contestant[]): Contestant[] {
  if (typeof window === 'undefined') return currentContestants; // Prevent running on server
  if (currentContestants.length === 0) return [];

  const contestantIndex = getRandomInt(0, currentContestants.length - 1);
  // Ensure we don't mutate the original state directly
  const updatedContestants = currentContestants.map(c => ({ ...c }));
  const contestantToUpdate = updatedContestants[contestantIndex];

  const problemKey = PROBLEM_KEYS[getRandomInt(0, PROBLEM_KEYS.length - 1)];

  // Simulate a new submission or re-submission
  const score = getRandomInt(1, 100); // New score
  const timeTaken = (contestantToUpdate[problemKey].timeTaken ?? 0) + getRandomInt(60, 600); // Add more time
  const systemTestsPassedPercent = getRandomInt(0, 100); // New pass percentage

  // Create a new problem submission object
  contestantToUpdate[problemKey] = { score, timeTaken, systemTestsPassedPercent };

  // Recalculate scores, times, percentages, and re-rank everyone
  return recalculateAndRank(updatedContestants);
}

/**
 * Simulates adding a new contestant.
 * IMPORTANT: This function uses Math.random() and should only be called client-side.
 */
export function simulateNewContestant(currentContestants: Contestant[]): Contestant[] {
    if (typeof window === 'undefined') return currentContestants; // Prevent running on server

    const newIndex = currentContestants.length;
    const countryInfo = countries[getRandomInt(0, countries.length - 1)];
    const newContestantBase: Omit<Contestant, 'rank' | 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent'> = {
        id: `contestant-${Date.now()}-${newIndex + 1}`, // More unique ID
        userName: `newbie_${newIndex + 1}_${getRandomInt(100, 999)}`, // Add random suffix
        country: countryInfo.name,
        countryFlagUrl: countryInfo.flagUrl,
        problemA: { score: null, timeTaken: null, systemTestsPassedPercent: null },
        problemB: { score: null, timeTaken: null, systemTestsPassedPercent: null },
        problemC: { score: null, timeTaken: null, systemTestsPassedPercent: null },
        problemD: { score: null, timeTaken: null, systemTestsPassedPercent: null },
        problemE: { score: null, timeTaken: null, systemTestsPassedPercent: null },
    };

     // Give the new contestant a small chance to have solved one problem
    if (getRandomInt(1, 10) <= 3) { // Use getRandomInt
        const problemKey = PROBLEM_KEYS[getRandomInt(0, PROBLEM_KEYS.length-1)];
        newContestantBase[problemKey] = {
            score: getRandomInt(30, 70),
            timeTaken: getRandomInt(1000, 3500),
            systemTestsPassedPercent: getRandomInt(50, 90)
        };
    }

    const newContestantWithCalcs = {
        ...newContestantBase,
        overallScore: calculateOverallScore(newContestantBase),
        overallTime: calculateOverallTime(newContestantBase),
        overallSystemTestsPassedPercent: calculateOverallSystemTestsPassedPercent(newContestantBase),
        rank: 0 // Initial rank before sorting
    };


    const combinedList = [...currentContestants, newContestantWithCalcs];

    return updateRanks(combinedList); // Add and re-rank
}
