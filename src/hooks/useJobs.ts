
import { useState, useEffect } from "react";
import { Job } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
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

      setJobs(processedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching jobs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

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

      setJobs([newJob, ...jobs]);
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
    return jobs.find(job => job.id === id) || null;
  };

  return {
    jobs,
    loading,
    addJob,
    updateJobStatus,
    getJobById,
    refreshJobs: fetchJobs
  };
};
