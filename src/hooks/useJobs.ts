
import { useState, useEffect, useCallback } from "react";
import { Job } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching jobs from Supabase...");
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        toast({
          title: "Error",
          description: "Failed to fetch jobs. " + error.message,
          variant: "destructive",
        });
        return;
      }

      // Convert Supabase data to Job type with proper skills_and_requirements conversion
      const processedJobs: Job[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        department: item.department,
        description: item.description,
        status: item.status,
        skills_and_requirements: item.skills_and_requirements as Record<string, number>,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      console.log(`Successfully fetched ${processedJobs.length} jobs`);
      setJobs(processedJobs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching jobs:", error);
      setError(errorMessage);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching jobs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const addJob = async (job: Omit<Job, "id" | "created_at" | "updated_at">) => {
    try {
      console.log("Adding job to Supabase:", job);
      const { data, error } = await supabase
        .from('jobs')
        .insert([job])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        toast({
          title: "Error",
          description: "Failed to add job. " + error.message,
          variant: "destructive",
        });
        return null;
      }

      // Convert the returned data to match Job type
      const newJob: Job = {
        id: data.id,
        title: data.title,
        department: data.department,
        description: data.description,
        status: data.status,
        skills_and_requirements: data.skills_and_requirements as Record<string, number>,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setJobs(prevJobs => [newJob, ...prevJobs]);
      return newJob;
    } catch (error) {
      console.error("Error adding job:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while adding a job.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateJobStatus = async (id: string, status: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update job status. " + error.message,
          variant: "destructive",
        });
        return;
      }

      setJobs(
        jobs.map(job => 
          job.id === id 
            ? { ...job, status } 
            : job
        )
      );
    } catch (error) {
      console.error("Error updating job status:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating job status.",
        variant: "destructive",
      });
    }
  };

  const getJobById = (id: string) => {
    const foundJob = jobs.find(job => job.id === id);
    console.log(`getJobById(${id}):`, foundJob || "not found");
    return foundJob || null;
  };

  return {
    jobs,
    loading,
    error,
    addJob,
    updateJobStatus,
    getJobById,
    refreshJobs: fetchJobs
  };
};
