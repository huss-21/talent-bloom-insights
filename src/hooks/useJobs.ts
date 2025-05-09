
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

      setJobs(data || []);
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
      const { data, error } = await supabase
        .from('jobs')
        .insert([job])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add job. " + error.message,
          variant: "destructive",
        });
        return null;
      }

      setJobs([data, ...jobs]);
      return data;
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
