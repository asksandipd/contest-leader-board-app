'use client';

import * as React from 'react';
import LeaderboardTable from '@/components/leaderboard/leaderboard-table';
import UpdateForm from '@/components/leaderboard/update-form';
// Import the simulation functions and the generator function itself
import { simulateUpdate, simulateNewContestant, initialContestants as serverGeneratedInitialContestants } from '@/data/initial-contestants';
import type { Contestant, ContestantUpdateInput, ProblemKey } from '@/types/contestant';
import { recalculateAndRank } from '@/lib/leaderboard-utils';
import { Button } from '@/components/ui/button';
import { Play, Pause, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state

export default function Home() {
  // Initialize state as empty to avoid hydration mismatch
  const [contestants, setContestants] = React.useState<Contestant[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true); // Add loading state
  const [isSimulating, setIsSimulating] = React.useState<boolean>(false);
  const simulationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Populate initial contestants on the client side after mount
  React.useEffect(() => {
    // Use the server-generated data as the initial state on the client.
    // This ensures the client starts with the same data the server rendered,
    // avoiding the hydration mismatch caused by client-side random generation
    // differing from server-side random generation.
    setContestants(serverGeneratedInitialContestants);
    setIsLoading(false); // Set loading to false after data is set
  }, []); // Empty dependency array ensures this runs only once on the client after mount


  const handleUpdate = (updateData: ContestantUpdateInput) => {
    setContestants((prevContestants) => {
      const targetIndex = prevContestants.findIndex(c => c.userName === updateData.userName);
      if (targetIndex === -1) {
        console.warn(`Contestant ${updateData.userName} not found for update.`);
        return prevContestants; // Return previous state if user not found
      }

       // Create a deep copy of the contestant to update to avoid direct state mutation
       const updatedContestant = JSON.parse(JSON.stringify(prevContestants[targetIndex]));


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
            if (typeof window !== 'undefined' && Math.random() < 0.1 && prevContestants.length < 1000) { // 10% chance to add new, limit total contestants
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
             <Button onClick={isSimulating ? stopSimulation : startSimulation} variant="outline" disabled={isLoading}>
                 {isSimulating ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                 {isSimulating ? 'Pause Simulation' : 'Start Simulation'}
             </Button>
              <Button onClick={handleAddNewContestant} variant="secondary" disabled={isLoading || contestants.length >= 1000}>
                 <UserPlus className="mr-2" /> Add New Contestant
             </Button>
        </div>

      {/* Show skeleton or placeholder while loading initial data */}
      {isLoading ? (
         <div className="w-full space-y-2 border rounded-md shadow-md p-4 h-[60vh] md:h-[70vh] overflow-hidden">
            <Skeleton className="h-12 w-full" />
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
         </div>
       ) : (
         <LeaderboardTable contestants={contestants} />
       )}

      <UpdateForm onSubmit={handleUpdate} existingUserNames={existingUserNames} disabled={isLoading} />
    </div>
  );
}
