"use client";

import * as React from "react";
import Image from 'next/image';
import type { Contestant, ProblemKey, ProblemSubmission } from "@/types/contestant";
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

  const renderProblemCell = (submission: ProblemSubmission) => {
    if (submission.score === null) {
      return <span className="text-muted-foreground">--</span>; // Not attempted
    }
    if (submission.score > 0) {
      // Solved
      return (
        <div className="flex flex-col items-center text-center">
          {/* Use text-green-600 directly or define a semantic class */}
          <span className="font-bold text-green-600">{submission.score}</span>
          <span className="text-xs text-muted-foreground">{formatTime(submission.timeTaken)}</span>
           {/* Optionally show pass % for solved attempts if needed */}
           {/* <span className="text-xs text-blue-500">{submission.systemTestsPassedPercent}%</span> */}
        </div>
      );
    } else {
       // Attempted but failed (score is 0 or non-positive)
       return (
        <div className="flex flex-col items-center text-center">
           {/* Use text-red-600 directly or define a semantic class */}
           <span className="font-bold text-red-600">{submission.score}</span>
           <span className="text-xs text-muted-foreground">{formatTime(submission.timeTaken)}</span>
           {/* Show pass % for failed attempts - use text-orange-500 or semantic class */}
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
                    // Remove general hover effect from row
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
                    <TableCell
                      key={key}
                      className={cn(
                        "text-center",
                        // Add hover effect specifically to problem cells
                        "hover:bg-problem-cell-hover hover:text-problem-cell-hover-foreground transition-colors duration-150"
                      )}
                    >
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
