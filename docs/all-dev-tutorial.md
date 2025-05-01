
# Building the Contestant Leaderboard App: A Step-by-Step Guide

This tutorial guides you through building the Contestant Leaderboard application, a Next.js app displaying a simulated real-time leaderboard for a coding contest.

**Target Audience:** Developers familiar with React, TypeScript, and basic Next.js concepts.

**Final Application Features:**
*   Dynamic leaderboard display.
*   Simulated real-time updates (score changes, new contestants).
*   Manual score/time update form.
*   Responsive design.
*   Animations for rank changes.

## 1. Project Setup

First, set up a new Next.js project using the App Router, TypeScript, and Tailwind CSS.

```bash
npx create-next-app@latest contestant-leaderboard --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd contestant-leaderboard
```

Now, initialize Shadcn/ui, which will help us quickly build styled components.

```bash
npx shadcn-ui@latest init
```

Choose the following options (or adjust as needed):
*   **Style:** Default
*   **Base color:** Neutral (We'll customize this later)
*   **CSS variables:** Yes
*   **`tailwind.config.js`:** `tailwind.config.ts`
*   **`globals.css`:** `src/app/globals.css`
*   **Components:** `@/components`
*   **Utils:** `@/lib/utils`

Install necessary dependencies for forms, animations, and utility functions:

```bash
npm install react-hook-form @hookform/resolvers zod framer-motion date-fns lucide-react
```

Add the required Shadcn/ui components:

```bash
npx shadcn-ui@latest add table scroll-area button card form input skeleton toaster tooltip sheet separator alert-dialog alert avatar badge calendar checkbox dialog dropdown-menu label menubar popover progress radio-group select slider switch tabs textarea aspect-ratio hover-card command combobox data-table navigation-menu pagination resizable sonner drawer carousel number-ticker breadcrumb input-otp
```
*Note: We add many components upfront, but you can add them as needed.*

## 2. Defining Data Structures

Define the core data types for our application.

**`src/types/contestant.ts`**:

```typescript
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
```

## 3. Utility Functions

Create helper functions for time formatting and leaderboard calculations.

**`src/lib/utils.ts`**:
*(Shadcn/ui already created `cn`. Add `formatTime` below it)*

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats time in seconds to hh:mm:ss format.
 * @param totalSeconds The total time in seconds.
 * @returns A string representing the time in hh:mm:ss format, or '--:--:--' if null/undefined.
 */
export function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) {
    return '--:--:--';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}
```

**`src/lib/leaderboard-utils.ts`**:

```typescript
import type { Contestant, ProblemKey, ProblemSubmission } from '@/types/contestant';
import { PROBLEM_KEYS } from '@/types/contestant';

/**
 * Calculates the overall score for a contestant based on individual problem scores.
 */
export function calculateOverallScore(contestant: Omit<Contestant, 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent' | 'rank' | 'countryFlagUrl' | 'id' >): number {
  return PROBLEM_KEYS.reduce((total, key) => {
    const score = contestant[key].score;
    return total + (score ?? 0);
  }, 0);
}

/**
 * Calculates the overall penalty time for a contestant.
 * Assumes penalty is only added for solved problems (score > 0).
 */
export function calculateOverallTime(contestant: Omit<Contestant, 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent' | 'rank' | 'countryFlagUrl' | 'id'>): number {
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
export function calculateOverallSystemTestsPassedPercent(contestant: Omit<Contestant, 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent' | 'rank' | 'countryFlagUrl' | 'id'>): number {
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
 * 3. Alphabetical by username (final tiebreaker).
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

   // Optional: Sort by system tests passed percentage ascending (higher is better as tie breaker)
   if(a.overallSystemTestsPassedPercent !== b.overallSystemTestsPassedPercent) {
     return b.overallSystemTestsPassedPercent - a.overallSystemTestsPassedPercent;
   }

  // Final tiebreaker: Sort by username ascending
  return a.userName.localeCompare(b.userName);
}

/**
 * Updates the ranks of contestants in a sorted list.
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
```

## 4. Styling the Application

Configure Tailwind CSS and set up global styles.

**`tailwind.config.ts`**:
*(Update the existing config)*

```typescript
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: { // Add container settings
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
  	extend: {
  		colors: {
        // Keep existing Shadcn color definitions...
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
        // Add specific theme colors below
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			ring: 'hsl(var(--ring))',
  			chart: { // Optional: Keep if using charts
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
        // Remove sidebar colors if not using sidebar component
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
        // Keep existing keyframes...
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
        // Keep existing animations...
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

**`src/app/globals.css`**:
*(Replace the existing content)*

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer base {
  :root {
    --background: 0 0% 20%; /* Dark Gray (#333333) */
    --foreground: 0 0% 98%; /* Light Gray/White for contrast */
    --card: 0 0% 20%; /* Dark Gray */
    --card-foreground: 0 0% 98%; /* Light Gray/White */
    --popover: 0 0% 20%; /* Dark Gray */
    --popover-foreground: 0 0% 98%; /* Light Gray/White */
    --primary: 211 100% 50%; /* Blue Accent (#007BFF) */
    --primary-foreground: 0 0% 100%; /* White */
    --secondary: 0 0% 94.1%; /* Light Gray (#f0f0f0) - For leaderboard rows */
    --secondary-foreground: 0 0% 20%; /* Dark Gray for text on light gray */
    --muted: 0 0% 30%; /* Muted shade between background and secondary */
    --muted-foreground: 0 0% 63.9%; /* Adjusted for contrast */
    --accent: 211 100% 50%; /* Blue Accent (#007BFF) */
    --accent-foreground: 0 0% 100%; /* White */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 30%; /* Mid-gray border */
    --input: 0 0% 30%; /* Input background */
    --input-foreground: 0 0% 98%; /* Input text color */
    --ring: 211 100% 50%; /* Blue Accent for focus rings */
    --radius: 0.5rem;

    /* Chart colors (optional) */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  /* Ensure body background and text colors are applied */
  body {
    @apply bg-background text-foreground;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom styles for leaderboard rows */
@layer components {
  .leaderboard-row {
    @apply bg-secondary text-secondary-foreground hover:bg-muted/50;
  }
  .leaderboard-row-alt {
     /* Example for alternating rows if needed */
     @apply bg-card text-card-foreground hover:bg-muted/50;
  }

  .leaderboard-header {
    @apply bg-primary/10 text-foreground; /* Slightly tinted header */
  }
}
```

Update the root layout to use a standard font and include the Toaster.

**`src/app/layout.tsx`**:

```typescript
import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Use a standard font like Inter
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ['latin'] }) // Initialize the font

export const metadata: Metadata = {
  title: 'CodeContest Leaderboard',
  description: 'Real-time leaderboard for coding contests',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font class to the body */}
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <main className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
          {children}
        </main>
        <Toaster /> {/* Add Toaster */}
      </body>
    </html>
  );
}
```

## 5. Data Generation and Simulation

Create logic to generate initial contestant data and simulate updates.

**Important:** To avoid Next.js hydration errors caused by `Math.random()` producing different results on the server and client, we'll generate initial data deterministically on the server and then rely on client-side `useEffect` to initiate randomness for simulation and initial population if needed.

**`public/assets/flags/`**:
Create this directory. Add some SVG flag icons (e.g., `us.svg`, `ca.svg`, `gb.svg`, `unknown.svg`). You can find free SVG flags online (like from flagpedia.net or similar sources). Make sure the filenames match the `flagUrl` property below.

**`src/data/initial-contestants.ts`**:

```typescript
import type { Contestant, ProblemKey } from '@/types/contestant';
import { PROBLEM_KEYS } from '@/types/contestant';
import { calculateOverallScore, calculateOverallTime, calculateOverallSystemTestsPassedPercent, updateRanks, recalculateAndRank } from '@/lib/leaderboard-utils';

const countries = [
  { name: 'USA', flagUrl: '/assets/flags/us.svg' },
  { name: 'Canada', flagUrl: '/assets/flags/ca.svg' },
  { name: 'Mexico', flagUrl: '/assets/flags/mx.svg' },
  { name: 'Brazil', flagUrl: '/assets/flags/br.svg' },
  { name: 'UK', flagUrl: '/assets/flags/gb.svg' },
  { name: 'Germany', flagUrl: '/assets/flags/de.svg' },
  { name: 'France', flagUrl: '/assets/flags/fr.svg' },
  { name: 'India', flagUrl: '/assets/flags/in.svg' },
  { name: 'China', flagUrl: '/assets/flags/cn.svg' },
  { name: 'Japan', flagUrl: '/assets/flags/jp.svg' },
  // Add more with corresponding flag SVGs in public/assets/flags
];

// Function to generate a random integer between min and max (inclusive)
// ENSURE this is ONLY called on the client-side (e.g., inside useEffect or event handlers)
const getRandomInt = (min: number, max: number): number => {
  if (typeof window === 'undefined') {
    console.warn("getRandomInt called on the server. Returning deterministic value.");
    // Provide a somewhat stable fallback for server if absolutely necessary,
    // but ideally, logic relying on this should be client-only.
    return min + (Date.now() % (max - min + 1));
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to generate a somewhat realistic username
// Use index for server-side consistency, random parts client-side
const generateUserName = (index: number): string => {
  const prefixes = ['coder', 'dev', 'ninja', 'hacker', 'wizard', 'alpha', 'beta', 'gamma'];
  const suffixes = ['pro', 'master', 'guru', 'expert', 'ace', 'king', 'queen'];
   if (typeof window === 'undefined') {
       // Deterministic username for server render
       return `${prefixes[index % prefixes.length]}_${suffixes[index % suffixes.length]}_${index + 1}`;
   }
   // Random username for client-side generation/simulation
   return `${prefixes[getRandomInt(0, prefixes.length - 1)]}_${suffixes[getRandomInt(0, suffixes.length - 1)]}_${index + 1 + getRandomInt(100, 999)}`;
};

// Generate initial contestant data (SERVER-SIDE SAFE VERSION)
// This version uses index-based logic for deterministic output during SSR.
const generateInitialContestantsServer = (count: number): Contestant[] => {
  const contestants: Omit<Contestant, 'rank' | 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent'>[] = [];

  for (let i = 0; i < count; i++) {
    const countryIndex = i % countries.length; // Deterministic country selection
    const countryInfo = countries[countryIndex];
    const contestantBase = {
      id: `contestant-${i + 1}-server`, // Server-specific ID format
      userName: generateUserName(i), // Will generate deterministic name on server
      country: countryInfo.name,
      countryFlagUrl: countryInfo.flagUrl,
    };

    const problemData: Record<ProblemKey, { score: number | null; timeTaken: number | null; systemTestsPassedPercent: number | null }> = {} as any;
    let solvedCount = 0;

    PROBLEM_KEYS.forEach((key, pIndex) => {
       const attemptDeterminant = (i + pIndex * 3) % 10; // Some deterministic value based on i and problem index
       if (attemptDeterminant <= 6) { // ~70% attempt chance, deterministically
            const problemIndex = pIndex;
            const successDeterminant = (i * (problemIndex + 1)) % 100; // Deterministic success check
            const successThreshold = (80 - problemIndex * 10); // 80% for A, 70% for B...
            const isSolved = successDeterminant < successThreshold;

            if(isSolved) {
              solvedCount++;
              const score = 75 + (i % 26); // Deterministic score
              const timeTaken = 1000 + (i * 100 % 2000); // Deterministic time
              const systemTestsPassedPercent = 90 + (i % 11); // Deterministic pass %
               problemData[key] = { score, timeTaken, systemTestsPassedPercent };
            } else {
                const score = 0;
                const timeTaken = 500 + (i * 50 % 1300); // Deterministic time
                const systemTestsPassedPercent = 30 + (i % 41); // Deterministic pass %
                problemData[key] = { score, timeTaken, systemTestsPassedPercent };
            }
      } else {
        // Not attempted
        problemData[key] = { score: null, timeTaken: null, systemTestsPassedPercent: null };
      }
    });

     // Ensure at least one solve for some contestants deterministically
     if (solvedCount === 0 && i > 10 && (i % 5 === 0)) {
        const problemIndex = i % PROBLEM_KEYS.length;
        const randomProblem = PROBLEM_KEYS[problemIndex];
        problemData[randomProblem] = {
             score: 75 + (i % 26),
             timeTaken: 1000 + (i * 100 % 2000),
             systemTestsPassedPercent: 90 + (i % 11)
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

  return updateRanks(fullContestants); // Calculate initial ranks
};

// Generate the initial data *once* when the module loads on the server.
const initialContestants = generateInitialContestantsServer(50);

// Export the server-generated data
export { initialContestants };

// --- Simulation Logic (CLIENT-SIDE ONLY) ---

/**
 * Simulates an update event for a random contestant.
 * IMPORTANT: This function uses getRandomInt and should only be called client-side.
 */
export function simulateUpdate(currentContestants: Contestant[]): Contestant[] {
  if (typeof window === 'undefined') {
      console.warn("simulateUpdate called on server.");
      return currentContestants; // Safety check
  }
  if (currentContestants.length === 0) return [];

  const contestantIndex = getRandomInt(0, currentContestants.length - 1);
  // Create a deep copy to avoid mutating state directly
   const updatedContestants = JSON.parse(JSON.stringify(currentContestants));
  const contestantToUpdate = updatedContestants[contestantIndex];

  const problemKey = PROBLEM_KEYS[getRandomInt(0, PROBLEM_KEYS.length - 1)];

  // Simulate a new submission or re-submission
  const isSolved = getRandomInt(1, 10) > 3; // 70% chance to "solve"
  const score = isSolved ? getRandomInt(1, 100) : 0;
  const timeTaken = (contestantToUpdate[problemKey]?.timeTaken ?? 0) + getRandomInt(60, 600); // Add more time
  const systemTestsPassedPercent = isSolved ? getRandomInt(70, 100) : getRandomInt(0, 60);

  contestantToUpdate[problemKey] = { score, timeTaken, systemTestsPassedPercent };

  // Recalculate and re-rank
  return recalculateAndRank(updatedContestants);
}

/**
 * Simulates adding a new contestant.
 * IMPORTANT: This function uses getRandomInt and should only be called client-side.
 */
export function simulateNewContestant(currentContestants: Contestant[]): Contestant[] {
    if (typeof window === 'undefined') {
      console.warn("simulateNewContestant called on server.");
      return currentContestants; // Safety check
    }

    const newIndex = currentContestants.length;
    const countryInfo = countries[getRandomInt(0, countries.length - 1)];
    const newContestantBase: Omit<Contestant, 'rank' | 'overallScore' | 'overallTime' | 'overallSystemTestsPassedPercent'> = {
        id: `contestant-${Date.now()}-${getRandomInt(1000, 9999)}`, // Unique ID
        userName: generateUserName(newIndex), // Will generate random name on client
        country: countryInfo.name,
        countryFlagUrl: countryInfo.flagUrl,
        problemA: { score: null, timeTaken: null, systemTestsPassedPercent: null },
        problemB: { score: null, timeTaken: null, systemTestsPassedPercent: null },
        problemC: { score: null, timeTaken: null, systemTestsPassedPercent: null },
        problemD: { score: null, timeTaken: null, systemTestsPassedPercent: null },
        problemE: { score: null, timeTaken: null, systemTestsPassedPercent: null },
    };

     // Give the new contestant a small chance to have solved one problem
    if (getRandomInt(1, 10) <= 3) {
        const problemKey = PROBLEM_KEYS[getRandomInt(0, PROBLEM_KEYS.length-1)];
        newContestantBase[problemKey] = {
            score: getRandomInt(30, 70),
            timeTaken: getRandomInt(1000, 3500),
            systemTestsPassedPercent: getRandomInt(50, 90)
        };
    }

    // Calculate initial stats for the new contestant
    const overallScore = calculateOverallScore(newContestantBase);
    const overallTime = calculateOverallTime(newContestantBase);
    const overallSystemTestsPassedPercent = calculateOverallSystemTestsPassedPercent(newContestantBase);

    const newContestantWithCalcs: Contestant = {
        ...newContestantBase,
        overallScore,
        overallTime,
        overallSystemTestsPassedPercent,
        rank: 0 // Initial rank before sorting
    };

    const combinedList = [...currentContestants, newContestantWithCalcs];

    // Re-rank the entire list including the new contestant
    return updateRanks(combinedList);
}
```

## 6. Building UI Components

Create the main UI components: the leaderboard table and the update form.

**`src/components/leaderboard/leaderboard-table.tsx`**:

```typescript
"use client";

import * as React from "react";
import Image from 'next/image';
import type { Contestant, ProblemKey } from "@/types/contestant";
import { PROBLEM_KEYS } from "@/types/contestant";
import { formatTime } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip

interface LeaderboardTableProps {
  contestants: Contestant[];
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ contestants }) => {

  const renderProblemCell = (submission: Contestant[ProblemKey]) => {
    if (submission.score === null) {
      return <span className="text-muted-foreground">--</span>; // Not attempted
    }
    if (submission.score > 0) {
      // Solved
      return (
        <div className="flex flex-col items-center text-center">
          <span className="font-bold text-green-600 dark:text-green-400">{submission.score}</span>
          <span className="text-xs text-muted-foreground">{formatTime(submission.timeTaken)}</span>
           {/* Optionally show pass % for solved attempts if needed */}
           {/* <span className="text-xs text-blue-500">{submission.systemTestsPassedPercent}%</span> */}
        </div>
      );
    } else {
       // Attempted but failed (score is 0 or non-positive)
       return (
        <div className="flex flex-col items-center text-center">
           <span className="font-bold text-red-600 dark:text-red-400">{submission.score}</span>
           <span className="text-xs text-muted-foreground">{formatTime(submission.timeTaken)}</span>
           {/* Show pass % for failed attempts */}
           <span className="text-xs text-orange-500">{submission.systemTestsPassedPercent ?? 0}%</span>
        </div>
       );
    }
  };

  return (
    // Wrap with TooltipProvider for flag tooltips
    <TooltipProvider>
      <ScrollArea className="h-[60vh] md:h-[70vh] w-full rounded-md border shadow-md">
        <Table className="relative min-w-full">
          <TableCaption>CodeContest Live Leaderboard</TableCaption>
          <TableHeader className="sticky top-0 z-10 leaderboard-header backdrop-blur-sm">
            <TableRow>
              <TableHead className="w-[50px] text-center">Rank</TableHead>
              <TableHead className="min-w-[150px]">User</TableHead>
              <TableHead className="w-[80px] text-center">Country</TableHead>
              {PROBLEM_KEYS.map((key) => (
                <TableHead key={key} className="w-[70px] text-center">{`P${key.charAt(key.length - 1)}`}</TableHead>
              ))}
              <TableHead className="w-[80px] text-center">Score</TableHead>
              <TableHead className="w-[80px] text-center">Time</TableHead>
              <TableHead className="w-[80px] text-center">Tests %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
              {contestants.map((contestant, index) => (
                <motion.tr
                  key={contestant.id} // Use unique ID for key
                  layout // Animate layout changes (rank changes)
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, backgroundColor: 'rgba(255, 0, 0, 0.3)' }} // Optional exit animation
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className={cn(
                    "leaderboard-row", // Base style from globals.css
                     // Add alternating row style if desired
                    // index % 2 === 1 ? "leaderboard-row-alt" : ""
                  )}
                >
                  <TableCell className="text-center font-medium">{contestant.rank}</TableCell>
                  <TableCell className="font-medium">{contestant.userName}</TableCell>
                  <TableCell className="text-center">
                    {/* Wrap flag in Tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Image
                          src={contestant.countryFlagUrl || '/assets/flags/unknown.svg'}
                          alt={`${contestant.country} flag`}
                          width={24}
                          height={16}
                          className="inline-block object-contain border border-muted cursor-default" // Added cursor-default
                          data-ai-hint="country flag"
                          // title={contestant.country} // Remove title, use Tooltip instead
                          unoptimized // Necessary for SVGs if not using a loader
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{contestant.country}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  {PROBLEM_KEYS.map((key) => (
                    <TableCell key={key} className="text-center">
                        {renderProblemCell(contestant[key])}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold text-primary">{contestant.overallScore}</TableCell>
                   <TableCell className="text-center text-sm text-muted-foreground">{formatTime(contestant.overallTime)}</TableCell>
                  <TableCell className="text-center text-sm">
                    {contestant.overallSystemTestsPassedPercent}%
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
             {/* Add placeholder if list is empty */}
             {contestants.length === 0 && (
               <TableRow>
                  <TableCell colSpan={PROBLEM_KEYS.length + 5} className="h-24 text-center text-muted-foreground">
                      No contestants yet. Waiting for data...
                  </TableCell>
               </TableRow>
              )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </TooltipProvider>
  );
};

export default LeaderboardTable;
```

**`src/components/leaderboard/update-form.tsx`**:

```typescript
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import type { ContestantUpdateInput, ProblemKey } from "@/types/contestant";
import { PROBLEM_KEYS } from "@/types/contestant";
import { cn } from "@/lib/utils";

// Zod schema for validation
const problemSchema = z.object({
  // Allow empty strings, coerce to number, handle null/undefined
  score: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().int().min(0).max(100).nullable().optional()
  ),
  timeTaken: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().int().min(0).max(3600).nullable().optional() // 0 to 1 hour in seconds
  ),
  systemTestsPassedPercent: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().int().min(0).max(100).nullable().optional()
  ),
}).partial().optional(); // All fields within a problem are optional, and the problem itself is optional


const formSchema = z.object({
  userName: z.string().min(1, { message: "Username is required." }),
  problemA: problemSchema,
  problemB: problemSchema,
  problemC: problemSchema,
  problemD: problemSchema,
  problemE: problemSchema,
});

type UpdateFormValues = z.infer<typeof formSchema>;

interface UpdateFormProps {
  onSubmit: (data: ContestantUpdateInput) => void;
  existingUserNames: string[]; // For autocomplete or validation suggestions
  disabled?: boolean;
}

const UpdateForm: React.FC<UpdateFormProps> = ({ onSubmit, existingUserNames, disabled = false }) => {
  const { toast } = useToast(); // Initialize toast
  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      // Initialize problem fields explicitly to null or undefined
      problemA: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
      problemB: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
      problemC: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
      problemD: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
      problemE: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
    },
  });

 const handleSubmit = (values: UpdateFormValues) => {
    // Filter out problems where no data was entered and ensure values are numbers or null
    const updateData: ContestantUpdateInput = {
      userName: values.userName,
    };

    let hasUpdate = false;
    PROBLEM_KEYS.forEach(key => {
      const problemInput = values[key];
      if (problemInput) {
        const problemOutput: Partial<ProblemSubmission> = {};
        let problemHasUpdate = false;

        // Process score
        if (problemInput.score !== undefined && problemInput.score !== null) {
           problemOutput.score = Number(problemInput.score);
           problemHasUpdate = true;
        } else if (problemInput.score === null) {
           problemOutput.score = null; // Explicitly set null if desired
           // Decide if setting to null counts as an update. Let's say yes for now.
           // problemHasUpdate = true;
        }

        // Process timeTaken
        if (problemInput.timeTaken !== undefined && problemInput.timeTaken !== null) {
           problemOutput.timeTaken = Number(problemInput.timeTaken);
           problemHasUpdate = true;
        } else if (problemInput.timeTaken === null) {
           problemOutput.timeTaken = null;
           // problemHasUpdate = true;
        }

        // Process systemTestsPassedPercent
        if (problemInput.systemTestsPassedPercent !== undefined && problemInput.systemTestsPassedPercent !== null) {
           problemOutput.systemTestsPassedPercent = Number(problemInput.systemTestsPassedPercent);
           problemHasUpdate = true;
        } else if (problemInput.systemTestsPassedPercent === null) {
           problemOutput.systemTestsPassedPercent = null;
           // problemHasUpdate = true;
        }

        // Only include the problem key if at least one field was updated
        if (problemHasUpdate) {
            updateData[key] = problemOutput;
            hasUpdate = true;
        }
      }
    });


    if (!existingUserNames.includes(values.userName)) {
         toast({
            variant: "destructive",
            title: "Submission Error",
            description: `User "${values.userName}" not found. Please enter an existing username.`,
        });
        return; // Stop submission if user doesn't exist
    }

     if (!hasUpdate) {
         toast({
             variant: "default", // Use default or warning variant
             title: "No Changes Detected",
             description: "Please enter score, time, or test % for at least one problem to submit an update.",
         });
         return; // Stop submission if no problem data is provided
     }


    onSubmit(updateData);
    toast({
      title: "Submission Received",
      description: `Updating details for ${values.userName}.`,
      variant: "default" // Explicitly set variant
    });
    form.reset(); // Clear form after submission
  };

  // Helper to handle input changes, converting empty string to undefined for RHF
  const handleInputChange = (fieldOnChange: (...event: any[]) => void, value: string) => {
    fieldOnChange(value === '' ? undefined : value);
  };


  return (
    <Card className={cn("w-full mt-8 shadow-lg", disabled && "opacity-50 pointer-events-none")}>
      <CardHeader>
        <CardTitle>Update Contestant Score</CardTitle>
        <CardDescription>Enter submission details for a contestant. Only fill fields you want to update.</CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset disabled={disabled} className="space-y-6"> {/* Disable form elements when disabled */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      {/* Use datalist for suggestions */}
                      <Input placeholder="e.g., coder_pro_123" {...field} list="usernames" />
                    </FormControl>
                     <datalist id="usernames">
                       {existingUserNames.map(name => <option key={name} value={name} />)}
                     </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                {PROBLEM_KEYS.map((key) => (
                  <div key={key} className="border p-4 rounded-md space-y-2 bg-card">
                    <h4 className="font-medium text-center text-primary">{`Problem ${key.charAt(key.length - 1)}`}</h4>
                     {/* Use field names like `problemA.score` */}
                    <FormField
                      control={form.control}
                      name={`${key}.score`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Score (0-100)</FormLabel>
                          <FormControl>
                             {/* Use text input, validation is handled by Zod */}
                            <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="--" {...field} value={field.value ?? ""} onChange={(e) => handleInputChange(field.onChange, e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`${key}.timeTaken`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Time (s, 0-3600)</FormLabel>
                          <FormControl>
                             <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="--" {...field} value={field.value ?? ""} onChange={(e) => handleInputChange(field.onChange, e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`${key}.systemTestsPassedPercent`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Tests % (0-100)</FormLabel>
                          <FormControl>
                             <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="--" {...field} value={field.value ?? ""} onChange={(e) => handleInputChange(field.onChange, e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full sm:w-auto mt-6">Submit Update</Button>
            </form>
          </Form>
        </fieldset>
      </CardContent>
    </Card>
  );
};

export default UpdateForm;
```

## 7. Implementing the Main Page

Combine the components and state management logic in the main page file.

**`src/app/page.tsx`**:

```typescript
'use client';

import * as React from 'react';
import LeaderboardTable from '@/components/leaderboard/leaderboard-table';
import UpdateForm from '@/components/leaderboard/update-form';
// Import simulation functions and the server-generated initial data
import { simulateUpdate, simulateNewContestant, initialContestants as serverGeneratedInitialContestants } from '@/data/initial-contestants';
import type { Contestant, ContestantUpdateInput, ProblemKey } from '@/types/contestant';
import { recalculateAndRank } from '@/lib/leaderboard-utils';
import { Button } from '@/components/ui/button';
import { Play, Pause, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function Home() {
  // Initialize state as empty to avoid hydration mismatch initially.
  const [contestants, setContestants] = React.useState<Contestant[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSimulating, setIsSimulating] = React.useState<boolean>(false);
  const simulationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Populate initial contestants on the client side after mount using server data.
  React.useEffect(() => {
    // Use the server-generated data as the initial state on the client.
    setContestants(serverGeneratedInitialContestants);
    setIsLoading(false);
  }, []); // Empty dependency array ensures this runs only once on the client after mount

  // Handle manual updates from the form
  const handleUpdate = (updateData: ContestantUpdateInput) => {
    setContestants((prevContestants) => {
      const targetIndex = prevContestants.findIndex(c => c.userName === updateData.userName);
      if (targetIndex === -1) {
        console.warn(`Contestant ${updateData.userName} not found for update.`);
        return prevContestants;
      }

       // Create a deep copy of the contestants array to avoid direct state mutation
       const updatedList = JSON.parse(JSON.stringify(prevContestants)) as Contestant[];
       const contestantToUpdate = updatedList[targetIndex];

      // Apply updates from updateData
      (Object.keys(updateData) as Array<keyof ContestantUpdateInput>).forEach(key => {
        if (key !== 'userName' && updateData[key]) {
           const problemUpdate = updateData[key as ProblemKey];
           if (problemUpdate) {
             // Ensure the problem object exists
             if (!contestantToUpdate[key as ProblemKey]) {
                 contestantToUpdate[key as ProblemKey] = { score: null, timeTaken: null, systemTestsPassedPercent: null };
             }
             // Merge partial updates: only update fields that are present in problemUpdate
             if (problemUpdate.score !== undefined) {
               contestantToUpdate[key as ProblemKey].score = problemUpdate.score;
             }
             if (problemUpdate.timeTaken !== undefined) {
               contestantToUpdate[key as ProblemKey].timeTaken = problemUpdate.timeTaken;
             }
             if (problemUpdate.systemTestsPassedPercent !== undefined) {
               contestantToUpdate[key as ProblemKey].systemTestsPassedPercent = problemUpdate.systemTestsPassedPercent;
             }
           }
        }
      });

      // Recalculate and re-rank the entire list
      return recalculateAndRank(updatedList);
    });
  };

   // Function to run a single simulation step (CLIENT-SIDE ONLY)
   const runSimulationStep = () => {
        setContestants(prevContestants => {
            // Randomly decide whether to update or add a new contestant
            // Ensure Math.random is only called client-side
            if (typeof window !== 'undefined' && Math.random() < 0.1 && prevContestants.length < 1000) {
                return simulateNewContestant(prevContestants);
            } else {
                return simulateUpdate(prevContestants);
            }
        });
    };

  // Start simulation (CLIENT-SIDE ONLY)
  const startSimulation = () => {
    if (simulationIntervalRef.current || typeof window === 'undefined') return; // Prevent server-side start
    setIsSimulating(true);
    // Run first step immediately, then interval
    runSimulationStep();
    simulationIntervalRef.current = setInterval(runSimulationStep, 1500);
  };

  // Stop simulation
  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      setIsSimulating(false);
    }
  };

  // Add new contestant manually (CLIENT-SIDE ONLY)
  const handleAddNewContestant = () => {
     if (typeof window !== 'undefined') { // Ensure client-side
       setContestants(prev => simulateNewContestant(prev));
     }
  };

  // Cleanup interval on component unmount
  React.useEffect(() => {
    return () => {
      stopSimulation();
    };
  }, []);

  // Memoize existing usernames for the update form datalist
  const existingUserNames = React.useMemo(() => contestants.map(c => c.userName), [contestants]);

  return (
    <div className="flex flex-col items-center w-full space-y-6">
        <h1 className="text-3xl font-bold text-center text-primary">CodeContest Leaderboard</h1>

        {/* Simulation Controls */}
        <div className="flex gap-4 items-center">
             <Button onClick={isSimulating ? stopSimulation : startSimulation} variant="outline" disabled={isLoading}>
                 {isSimulating ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                 {isSimulating ? 'Pause Simulation' : 'Start Simulation'}
             </Button>
              <Button onClick={handleAddNewContestant} variant="secondary" disabled={isLoading || contestants.length >= 1000}>
                 <UserPlus className="mr-2 h-4 w-4" /> Add New Contestant
             </Button>
        </div>

      {/* Show skeleton while loading initial data */}
      {isLoading ? (
         <div className="w-full space-y-2 border rounded-md shadow-md p-4 h-[60vh] md:h-[70vh] overflow-hidden">
            <Skeleton className="h-12 w-full mb-2" /> {/* Header skeleton */}
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full mb-1" /> // Row skeletons
            ))}
         </div>
       ) : (
         <LeaderboardTable contestants={contestants} />
       )}

      {/* Conditionally render form only after loading */}
      {!isLoading && (
         <UpdateForm onSubmit={handleUpdate} existingUserNames={existingUserNames} disabled={isSimulating} />
      )}
    </div>
  );
}

```

## 8. Final Touches and Running the App

*   **README:** Update `README.md` with project details, setup instructions, and technologies used.
*   **Favicon:** (Optional) Add a `favicon.ico` to the `public` directory.
*   **Flags:** Ensure you have the flag SVG files in `public/assets/flags/` corresponding to the countries defined in `initial-contestants.ts`.

**Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or your configured port) in your browser.

You should now have a functioning Contestant Leaderboard application! You can:
*   See the initial leaderboard.
*   Start/Pause the simulation to see scores and ranks change dynamically.
*   Manually add a new contestant.
*   Use the form to update scores/times for existing contestants.

This tutorial provides a solid foundation. You can further enhance it by:
*   Adding more sophisticated simulation logic.
*   Implementing real-time updates using WebSockets or server-sent events.
*   Connecting to a real backend database.
*   Adding authentication and user roles.
*   Improving accessibility and testing.
*   Integrating GenAI features (e.g., generating contest problems, analyzing code submissions - requires setting up Genkit).

