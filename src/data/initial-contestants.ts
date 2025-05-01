import type { Contestant, ProblemKey } from '@/types/contestant';
import { PROBLEM_KEYS } from '@/types/contestant';
// Import recalculateAndRank, and confirm other needed functions are also imported
import { calculateOverallScore, calculateOverallTime, calculateOverallSystemTestsPassedPercent, updateRanks, recalculateAndRank } from '@/lib/leaderboard-utils';

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
   // Ensure random generation only happens client-side
   if (typeof window === 'undefined') {
       return `${prefixes[index % prefixes.length]}_${suffixes[index % suffixes.length]}_${index + 1}`;
   }
  return `${prefixes[getRandomInt(0, prefixes.length - 1)]}_${suffixes[getRandomInt(0, suffixes.length - 1)]}_${index + 1}`;
};

// Generate initial contestant data
const generateInitialContestants = (count: number): Contestant[] => {
  const contestants: Omit<Contestant, 'rank' | 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent'>[] = [];

  for (let i = 0; i < count; i++) {
    // Use modulo for server-side consistency, random for client
    const countryIndex = typeof window === 'undefined' ? i % countries.length : getRandomInt(0, countries.length - 1);
    const countryInfo = countries[countryIndex];
    const contestantBase = {
      id: `contestant-${i + 1}-${typeof window === 'undefined' ? 'server' : getRandomInt(1000, 9999)}`, // Add random element to ID only client-side
      userName: generateUserName(i),
      country: countryInfo.name,
      countryFlagUrl: countryInfo.flagUrl,
    };

    const problemData: Record<ProblemKey, { score: number | null; timeTaken: number | null; systemTestsPassedPercent: number | null }> = {} as any;

    let solvedCount = 0;
    PROBLEM_KEYS.forEach(key => {
      // Consistent check for server, random for client
       const attemptCheck = typeof window === 'undefined' ? (i % 10) <= 6 : getRandomInt(1, 10) <= 7;
      if (attemptCheck) { // Use getRandomInt client-side
            const problemIndex = PROBLEM_KEYS.indexOf(key);
            const successChance = 0.8 - problemIndex * 0.1; // e.g., 80% for A, 70% for B,...
            // Consistent check for server, random for client
            const solveCheck = typeof window === 'undefined' ? ((i * (problemIndex + 1)) % 100) <= successChance * 100 : getRandomInt(1, 100) <= successChance * 100;
            const isSolved = solveCheck; // Use getRandomInt client-side

            if(isSolved) {
              solvedCount++;
              // Consistent scores/times for server, random for client
              const score = typeof window === 'undefined' ? 75 + (i % 26) : getRandomInt(50, 100); // Score if solved
              const timeTaken = typeof window === 'undefined' ? 1000 + (i * 100 % 2000) : getRandomInt(300, 3000); // Time taken if solved (5min to 50min)
              const systemTestsPassedPercent = typeof window === 'undefined' ? 90 + (i % 11) : getRandomInt(80, 100); // High pass rate if solved
               problemData[key] = { score, timeTaken, systemTestsPassedPercent };
            } else {
                const score = 0; // Score is 0 if not solved correctly
                // Consistent times for server, random for client
                const timeTaken = typeof window === 'undefined' ? 500 + (i * 50 % 1300) : getRandomInt(100, 1800); // Time spent on attempt
                const systemTestsPassedPercent = typeof window === 'undefined' ? 30 + (i % 41) : getRandomInt(0, 70); // Lower pass rate
                problemData[key] = { score, timeTaken, systemTestsPassedPercent };
            }

      } else {
        // Not attempted
        problemData[key] = { score: null, timeTaken: null, systemTestsPassedPercent: null };
      }
    });

    // Consistent check for server, random for client
    const ensureSolvedCheck = typeof window === 'undefined' ? (i > 10 && (i % 10) <= 4) : (i > 10 && getRandomInt(1, 10) <= 5);
    if (solvedCount === 0 && ensureSolvedCheck) { // Use getRandomInt client-side
        const randomProblemIndex = typeof window === 'undefined' ? i % PROBLEM_KEYS.length : getRandomInt(0, PROBLEM_KEYS.length - 1);
        const randomProblem = PROBLEM_KEYS[randomProblemIndex];
        problemData[randomProblem] = {
             score: typeof window === 'undefined' ? 75 + (i % 26) : getRandomInt(50, 100),
             timeTaken: typeof window === 'undefined' ? 1000 + (i * 100 % 2000) : getRandomInt(300, 3000),
             systemTestsPassedPercent: typeof window === 'undefined' ? 90 + (i % 11) : getRandomInt(80, 100)
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

// Generate initial data outside of the component to avoid re-running on every render
// Moved generation into useEffect in page.tsx to avoid hydration errors
const initialContestantsData = generateInitialContestants(50); // Generate server-side consistent data


// Export the generated data (will be consistent on server, overwritten on client)
export { initialContestantsData as initialContestants };


// --- Simulation Logic ---

/**
 * Simulates an update event for a random contestant.
 * IMPORTANT: This function uses Math.random() and should only be called client-side.
 */
export function simulateUpdate(currentContestants: Contestant[]): Contestant[] {
  if (typeof window === 'undefined') return currentContestants; // Prevent running on server
  if (currentContestants.length === 0) return [];

  const contestantIndex = getRandomInt(0, currentContestants.length - 1);
  // Create a deep copy to ensure nested problem objects are copied too
   const updatedContestants = currentContestants.map(c => ({
     ...c,
     problemA: { ...c.problemA },
     problemB: { ...c.problemB },
     problemC: { ...c.problemC },
     problemD: { ...c.problemD },
     problemE: { ...c.problemE },
   }));
  const contestantToUpdate = updatedContestants[contestantIndex];

  const problemKey = PROBLEM_KEYS[getRandomInt(0, PROBLEM_KEYS.length - 1)];

  // Simulate a new submission or re-submission
  const score = getRandomInt(1, 100); // New score
  const timeTaken = (contestantToUpdate[problemKey].timeTaken ?? 0) + getRandomInt(60, 600); // Add more time
  const systemTestsPassedPercent = getRandomInt(0, 100); // New pass percentage

  // Update the copied contestant's problem data directly
  contestantToUpdate[problemKey] = { score, timeTaken, systemTestsPassedPercent };

  // Recalculate scores, times, percentages, and re-rank everyone using the imported function
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

    // Use updateRanks here as scores/times were calculated before adding
    return updateRanks(combinedList);
}
