'use client';

import * as React from 'react';
import LeaderboardTable from '@/components/leaderboard/leaderboard-table';
import UpdateForm from '@/components/leaderboard/update-form';
import { initialContestants, simulateUpdate, simulateNewContestant } from '@/data/initial-contestants';
import type { Contestant, ContestantUpdateInput, ProblemKey } from '@/types/contestant';
import { calculateOverallScore, calculateOverallTime, calculateOverallSystemTestsPassedPercent, updateRanks, recalculateAndRank } from '@/lib/leaderboard-utils';
import { Button } from '@/components/ui/button';
import { Play, Pause, UserPlus } from 'lucide-react';

export default function Home() {
  const [contestants, setContestants] = React.useState<Contestant[]>(initialContestants);
  const [isSimulating, setIsSimulating] = React.useState<boolean>(false);
  const simulationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleUpdate = (updateData: ContestantUpdateInput) => {
    setContestants((prevContestants) => {
      const targetIndex = prevContestants.findIndex(c => c.userName === updateData.userName);
      if (targetIndex === -1) {
        console.warn(`Contestant ${updateData.userName} not found for update.`);
        return prevContestants; // Return previous state if user not found
      }

      const updatedContestant = { ...prevContestants[targetIndex] }; // Shallow copy

      // Update problem data
      (Object.keys(updateData) as Array<keyof ContestantUpdateInput>).forEach(key => {
        if (key !== 'userName' && updateData[key]) {
          // Ensure the problem object exists before updating
           if (!updatedContestant[key as ProblemKey]) {
               updatedContestant[key as ProblemKey] = { score: null, timeTaken: null, systemTestsPassedPercent: null };
           }
           // Merge partial updates
          updatedContestant[key as ProblemKey] = {
            ...updatedContestant[key as ProblemKey], // Keep existing values
            ...updateData[key], // Overwrite with new values
          };
        }
      });

      // Create the new list with the updated contestant
      const newList = [
        ...prevContestants.slice(0, targetIndex),
        updatedContestant,
        ...prevContestants.slice(targetIndex + 1),
      ];

      // Recalculate and re-rank the entire list
      return recalculateAndRank(newList);
    });
  };

   // Function to run a single simulation step
   const runSimulationStep = () => {
        setContestants(prevContestants => {
            // Randomly decide whether to update or add a new contestant
            if (Math.random() < 0.1 && prevContestants.length < 1000) { // 10% chance to add new, limit total contestants
                return simulateNewContestant(prevContestants);
            } else {
                return simulateUpdate(prevContestants);
            }
        });
    };


  // Start simulation
  const startSimulation = () => {
    if (simulationIntervalRef.current) return; // Already running
    setIsSimulating(true);
    simulationIntervalRef.current = setInterval(runSimulationStep, 1500); // Update every 1.5 seconds
  };

  // Stop simulation
  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      setIsSimulating(false);
    }
  };

  // Add new contestant manually
  const handleAddNewContestant = () => {
     setContestants(prev => simulateNewContestant(prev));
  };


  // Cleanup interval on component unmount
  React.useEffect(() => {
    return () => {
      stopSimulation(); // Ensure interval is cleared
    };
  }, []);


  // Memoize existing usernames to avoid recalculating on every render
  const existingUserNames = React.useMemo(() => contestants.map(c => c.userName), [contestants]);


  return (
    <div className="flex flex-col items-center w-full space-y-6">
        <h1 className="text-3xl font-bold text-center text-primary">CodeContest Leaderboard</h1>

        {/* Simulation Controls */}
        <div className="flex gap-4 items-center">
             <Button onClick={isSimulating ? stopSimulation : startSimulation} variant="outline">
                 {isSimulating ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                 {isSimulating ? 'Pause Simulation' : 'Start Simulation'}
             </Button>
              <Button onClick={handleAddNewContestant} variant="secondary" disabled={contestants.length >= 1000}>
                 <UserPlus className="mr-2" /> Add New Contestant
             </Button>
        </div>


      <LeaderboardTable contestants={contestants} />
      <UpdateForm onSubmit={handleUpdate} existingUserNames={existingUserNames} />
    </div>
  );
}
