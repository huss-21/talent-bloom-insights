
import { useState, useEffect, useCallback } from "react";
import { JobOpening } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MOCK_JOB_OPENINGS: JobOpening[] = [
  {
    id: "1",
    title: "Frontend Developer",
    description: "We are seeking a skilled frontend developer with experience in React, TypeScript, and modern CSS frameworks.",
    department: "Engineering",
    criteria: {
      "React": 80,
      "TypeScript": 70,
      "CSS": 60,
      "Testing": 50,
      "Communication": 40
    },
    status: "open",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  },
  {
    id: "2",
    title: "Backend Engineer",
    description: "Looking for a backend engineer with strong skills in API development, database design, and Node.js.",
    department: "Engineering",
    criteria: {
      "Node.js": 80,
      "Database Design": 70,
      "API Development": 60,
      "Problem Solving": 50,
      "Communication": 40
    },
    status: "open",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: "3",
    title: "UX/UI Designer",
    description: "Seeking a talented UX/UI designer to create intuitive and engaging user experiences for our web and mobile applications.",
    department: "Design",
    criteria: {
      "UI Design": 80,
      "UX Research": 70,
      "Prototyping": 60,
      "Visual Design": 50,
      "Communication": 40
    },
    status: "closed",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  }
];

export const useJobOpenings = () => {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch job openings from Supabase
  const fetchJobOpenings = useCallback(async () => {
    try {
      console.log("Fetching job openings...");
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        console.log("Fetched job openings:", data);
        
        // Transform data to match our JobOpening type
        const transformedJobs: JobOpening[] = data.map(job => ({
          id: job.id,
          title: job.title,
          description: job.description,
          department: job.department,
          criteria: typeof job.skills_and_requirements === 'object' 
            ? job.skills_and_requirements 
            : {},
          status: job.status ? "open" : "closed",
          createdAt: job.created_at,
          updatedAt: job.updated_at
        }));
        
        setJobOpenings(transformedJobs);
      } else {
        console.log("No job data found, using mock data");
        setJobOpenings(MOCK_JOB_OPENINGS);
      }
    } catch (error) {
      console.error("Error fetching job openings:", error);
      setError(error as Error);
      
      // Use mock data as fallback
      console.log("Using mock job opening data due to error");
      setJobOpenings(MOCK_JOB_OPENINGS);
      
      toast({
        title: "Error loading jobs",
        description: "Failed to load job openings. Using sample data instead.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobOpenings();
    
    // Set up a retry mechanism for network issues
    const retryInterval = setInterval(() => {
      if (error) {
        console.log("Retrying job openings fetch due to previous error");
        fetchJobOpenings();
      }
    }, 30000); // Retry every 30 seconds if there was an error
    
    return () => clearInterval(retryInterval);
  }, [fetchJobOpenings, error]);

  // Get a single job opening by id
  const getJobById = (id: string): JobOpening | undefined => {
    return jobOpenings.find(job => job.id === id);
  };

  // Get all open job openings
  const getOpenJobs = (): JobOpening[] => {
    return jobOpenings.filter(job => job.status === "open");
  };

  // Refresh job openings data
  const refreshJobs = async () => {
    await fetchJobOpenings();
  };

  return {
    jobOpenings,
    loading,
    error,
    getJobById,
    getOpenJobs,
    refreshJobs
  };
};
