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
import { useToast } from "@/hooks/use-toast";
import type { ContestantUpdateInput, ProblemKey } from "@/types/contestant";
import { PROBLEM_KEYS } from "@/types/contestant";

// Zod schema for validation
const problemSchema = z.object({
  score: z.coerce.number().int().min(0).max(100).optional().nullable(),
  timeTaken: z.coerce.number().int().min(0).max(3600).optional().nullable(), // 0 to 1 hour in seconds
  systemTestsPassedPercent: z.coerce.number().int().min(0).max(100).optional().nullable(),
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
}

const UpdateForm: React.FC<UpdateFormProps> = ({ onSubmit, existingUserNames }) => {
  const { toast } = useToast();
  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      // Initialize problem fields to prevent uncontrolled component warnings
      problemA: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
      problemB: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
      problemC: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
      problemD: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
      problemE: { score: undefined, timeTaken: undefined, systemTestsPassedPercent: undefined },
    },
  });

 const handleSubmit = (values: UpdateFormValues) => {
    // Filter out problems where no data was entered
    const updateData: ContestantUpdateInput = {
      userName: values.userName,
    };

    let hasUpdate = false;
    PROBLEM_KEYS.forEach(key => {
      const problemInput = values[key];
       // Check if any field in the problemInput is not undefined or null
       if (problemInput && Object.values(problemInput).some(val => val !== undefined && val !== null)) {
           updateData[key] = {};
           if (problemInput.score !== undefined && problemInput.score !== null) {
               updateData[key]!.score = problemInput.score;
               hasUpdate = true;
           }
           if (problemInput.timeTaken !== undefined && problemInput.timeTaken !== null) {
               updateData[key]!.timeTaken = problemInput.timeTaken;
               hasUpdate = true;
           }
            if (problemInput.systemTestsPassedPercent !== undefined && problemInput.systemTestsPassedPercent !== null) {
               updateData[key]!.systemTestsPassedPercent = problemInput.systemTestsPassedPercent;
               hasUpdate = true;
           }
            // If no specific field was updated but the object exists, clean it up
           if (Object.keys(updateData[key]!).length === 0) {
             delete updateData[key];
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
             variant: "destructive",
             title: "No Changes",
             description: "Please enter score, time, or test % for at least one problem.",
         });
         return; // Stop submission if no problem data is provided
     }


    onSubmit(updateData);
    toast({
      title: "Submission Received",
      description: `Updating details for ${values.userName}.`,
    });
    form.reset(); // Clear form after submission
  };

  return (
    <Card className="w-full mt-8 shadow-lg">
      <CardHeader>
        <CardTitle>Update Contestant Score</CardTitle>
        <CardDescription>Enter submission details for a contestant. Only fill fields you want to update.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., coder_pro_123" {...field} list="usernames" />
                  </FormControl>
                   <datalist id="usernames">
                        {existingUserNames.map(name => <option key={name} value={name} />)}
                   </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {PROBLEM_KEYS.map((key) => (
                <div key={key} className="border p-4 rounded-md space-y-2 bg-card">
                   <h4 className="font-medium text-center text-primary">{`Problem ${key.charAt(key.length - 1)}`}</h4>
                   <FormField
                     control={form.control}
                     name={`${key}.score`}
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="text-xs">Score (0-100)</FormLabel>
                         <FormControl>
                           <Input type="number" placeholder="--" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} />
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
                           <Input type="number" placeholder="--" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} />
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
                           <Input type="number" placeholder="--" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
              ))}
            </div>

            <Button type="submit" className="w-full sm:w-auto">Submit Update</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UpdateForm;
