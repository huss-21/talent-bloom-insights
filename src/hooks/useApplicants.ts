
import { useState, useEffect, useCallback } from "react";
import { Applicant, Rating } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Mock data for applicants - keeping these for fallback purposes
const MOCK_APPLICANTS: Applicant[] = [
  {
    id: "1",
    userId: "2", // John Applicant
    jobId: "1", // Frontend Developer
    resumeUrl: "/mock-resume.pdf",
    applicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    Skills: 85,
    Education: 75,
    Relevance: 80,
    Overall: 82
  },
  {
    id: "2",
    userId: "3", // Mock user
    jobId: "1", // Frontend Developer
    resumeUrl: "/mock-resume-2.pdf",
    applicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    Skills: 70,
    Education: 85,
    Relevance: 65,
    Overall: 75
  },
  {
    id: "3",
    userId: "4", // Mock user
    jobId: "2", // Backend Engineer
    resumeUrl: "/mock-resume-3.pdf",
    applicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    Skills: 90,
    Education: 70,
    Relevance: 85,
    Overall: 83
  }
];

// Mock data for ratings
const MOCK_RATINGS: Rating[] = [
  {
    id: "1",
    applicantId: "1",
    criteriaScores: {
      "React": 85,
      "TypeScript": 75,
      "CSS": 90,
      "Testing": 65,
      "Communication": 80
    },
    overallMatchPercentage: 82,
    skillsMatchPercentage: 80,
    educationMatchPercentage: 85,
    experienceMatchPercentage: 78,
    keyPhrases: [
      "5 years of React experience",
      "Built multiple enterprise applications",
      "Proficient with TypeScript",
      "Experienced with Jest and React Testing Library"
    ],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
  },
  {
    id: "2",
    applicantId: "2",
    criteriaScores: {
      "React": 70,
      "TypeScript": 85,
      "CSS": 65,
      "Testing": 90,
      "Communication": 75
    },
    overallMatchPercentage: 75,
    skillsMatchPercentage: 72,
    educationMatchPercentage: 90,
    experienceMatchPercentage: 68,
    keyPhrases: [
      "3 years of React development",
      "TypeScript expert",
      "Strong testing background",
      "Needs improvement in CSS"
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: "3",
    applicantId: "3",
    criteriaScores: {
      "Node.js": 90,
      "Database Design": 80,
      "API Development": 85,
      "Problem Solving": 75,
      "Communication": 70
    },
    overallMatchPercentage: 83,
    skillsMatchPercentage: 88,
    educationMatchPercentage: 75,
    experienceMatchPercentage: 82,
    keyPhrases: [
      "7 years of Node.js development",
      "Designed scalable database systems",
      "Built RESTful and GraphQL APIs",
      "Experience with microservices"
    ],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
  }
];

export const useApplicants = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchRetries, setFetchRetries] = useState(0);

  // Fetch applicants and ratings from Supabase
  const fetchApplicantsAndRatings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching job applications, attempt:", fetchRetries + 1);
      
      // 1. Fetch job applications from the new table
      // Add 'as any' type assertion to fix TypeScript errors with Supabase
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications' as any)
        .select('*')
        .order('applied_at', { ascending: false });

      if (applicationsError) {
        throw applicationsError;
      }

      console.log("Raw applications data from DB:", applicationsData);

      // 2. Transform data to match our Applicant type
      let transformedApplicants: Applicant[] = [];
      
      if (!applicationsData || applicationsData.length === 0) {
        console.log("No applications found in database, using mock data");
        setApplicants(MOCK_APPLICANTS);
      } else {
        transformedApplicants = applicationsData.map((app: any) => ({
          id: app.id,
          userId: app.user_id,
          jobId: app.job_id,
          fullName: app.full_name,
          email: app.email,
          nationalId: app.national_id || '',
          resumeUrl: app.resume_url || '',
          resumeFileName: app.resume_file_name || '',
          resumeFilePath: app.resume_file_path || '',
          applicationDate: app.applied_at,
          status: app.status,
          matchScore: app.match_score,
          jobDescription: app.job_description || '',
          Skills: app.Skills,
          Education: app.Education,
          Relevance: app.Relevance,
          Overall: app.Overall
        }));
        
        setApplicants(transformedApplicants);
        console.log("Transformed applications:", transformedApplicants);
      }

      // 3. Fetch ratings from the database
      console.log("Fetching ratings data");
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (ratingsError) {
        throw ratingsError;
      }

      if (!ratingsData || ratingsData.length === 0) {
        console.log("No ratings found in database, using mock data");
        setRatings(MOCK_RATINGS);
      } else {
        // Transform data to match our Rating type
        const transformedRatings: Rating[] = ratingsData.map((rating: any) => {
          // Parse criteria_scores from JSON if needed
          let criteriaScores: Record<string, number> = {};
          
          try {
            if (typeof rating.criteria_scores === 'string') {
              criteriaScores = JSON.parse(rating.criteria_scores);
            } else if (rating.criteria_scores && typeof rating.criteria_scores === 'object') {
              criteriaScores = rating.criteria_scores as Record<string, number>;
            }
          } catch (error) {
            console.error("Error parsing criteria scores:", error);
            criteriaScores = {};
          }
          
          return {
            id: rating.id,
            applicantId: rating.applicant_id,
            criteriaScores: criteriaScores,
            overallMatchPercentage: rating.overall_match_percentage,
            skillsMatchPercentage: rating.skills_match_percentage,
            educationMatchPercentage: rating.education_match_percentage,
            experienceMatchPercentage: rating.experience_match_percentage,
            keyPhrases: Array.isArray(rating.key_phrases) ? rating.key_phrases : [],
            createdAt: rating.created_at
          };
        });
        
        setRatings(transformedRatings);
        console.log("Fetched ratings:", transformedRatings);
      }

      // Reset retry counter on successful fetch
      setFetchRetries(0);
      
    } catch (error) {
      console.error("Error fetching applicants data:", error);
      setError(error as Error);
      
      // Increment retry counter
      setFetchRetries(prev => prev + 1);
      
      if (fetchRetries < 3) {
        // Only show toast for the first retry
        if (fetchRetries === 0) {
          toast({
            title: "Loading error",
            description: "Having trouble loading data. Retrying in the background...",
            variant: "destructive",
          });
        }
        
        // Fall back to mock data if there's an error
        if (!applicants.length) {
          setApplicants(MOCK_APPLICANTS);
        }
        if (!ratings.length) {
          setRatings(MOCK_RATINGS);
        }
        
        // Schedule a retry
        setTimeout(() => {
          console.log("Retrying fetch due to error, attempt:", fetchRetries + 1);
          fetchApplicantsAndRatings();
        }, 3000);
      } else {
        toast({
          title: "Error",
          description: "Failed to load applicants data after multiple attempts. Using mock data instead.",
          variant: "destructive",
        });
        
        // Fall back to mock data if there's an error
        setApplicants(MOCK_APPLICANTS);
        setRatings(MOCK_RATINGS);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchRetries, applicants.length, ratings.length]);

  useEffect(() => {
    fetchApplicantsAndRatings();
    
    // Setup auto-refresh of data
    const refreshInterval = setInterval(() => {
      if (error) {
        console.log("Attempting to refresh data due to previous error");
        fetchApplicantsAndRatings();
      }
    }, 60000); // Every minute if there was an error
    
    return () => clearInterval(refreshInterval);
  }, [fetchApplicantsAndRatings, error]);

  // Add a new application to the database
  const addApplication = async (application: {
    userId: string;
    jobId: string;
    fullName: string;
    email: string;
    nationalId?: string;
    resumeUrl?: string;
    coverLetter?: string;
    resumeFileName?: string;
    resumeFilePath?: string;
    jobDescription?: string;
  }) => {
    try {
      console.log("Submitting application to Supabase:", application);
      
      // If job description is not provided, try to fetch it
      let jobDescription = application.jobDescription || '';
      
      if (!jobDescription) {
        // Fetch the job description from the jobs table
        const { data: jobData, error: jobError } = await supabase
          .from('jobs' as any)
          .select('description')
          .eq('id', application.jobId)
          .single();
        
        if (jobError) {
          console.error("Error fetching job description:", jobError);
        } else if (jobData) {
          jobDescription = jobData.description || '';
        }
      }
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('job_applications' as any)
        .insert({
          user_id: application.userId,
          job_id: application.jobId,
          full_name: application.fullName,
          email: application.email,
          national_id: application.nationalId || null,
          resume_url: application.resumeUrl || null,
          cover_letter: application.coverLetter || null,
          resume_file_name: application.resumeFileName || null,
          resume_file_path: application.resumeFilePath || null,
          job_description: jobDescription // Store the job description
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Application created successfully:", data);

      // Transform to our Applicant type
      const newApplicant: Applicant = {
        id: data?.id || '',
        userId: data?.user_id || '',
        jobId: data?.job_id || '',
        fullName: data?.full_name || '',
        email: data?.email || '',
        nationalId: data?.national_id || '',
        resumeUrl: data?.resume_url || '',
        resumeFileName: data?.resume_file_name || '',
        resumeFilePath: data?.resume_file_path || '',
        applicationDate: data?.applied_at || new Date().toISOString(),
        status: data?.status || 'pending',
        matchScore: data?.match_score || null,
        jobDescription: data?.job_description || '',
        Skills: data?.Skills || null,
        Education: data?.Education || null,
        Relevance: data?.Relevance || null,
        Overall: data?.Overall || null
      };

      // Update local state
      setApplicants((prevApplicants) => [newApplicant, ...prevApplicants]);
      return newApplicant;
    } catch (error) {
      console.error("Error adding application:", error);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update the status of an application
  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Update local state
      setApplicants(applicants.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
      
      return true;
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add a rating for an applicant after resume analysis
  const addRating = async (rating: Omit<Rating, "id" | "createdAt">) => {
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('ratings' as any)
        .insert({
          applicant_id: rating.applicantId,
          criteria_scores: rating.criteriaScores,
          overall_match_percentage: rating.overallMatchPercentage,
          skills_match_percentage: rating.skillsMatchPercentage,
          education_match_percentage: rating.educationMatchPercentage,
          experience_match_percentage: rating.experienceMatchPercentage,
          key_phrases: rating.keyPhrases
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transform to our Rating type
      const newRating: Rating = {
        id: data?.id || '',
        applicantId: data?.applicant_id || '',
        criteriaScores: (data?.criteria_scores as Record<string, number>) || {},
        overallMatchPercentage: data?.overall_match_percentage || 0,
        skillsMatchPercentage: data?.skills_match_percentage || 0,
        educationMatchPercentage: data?.education_match_percentage || 0,
        experienceMatchPercentage: data?.experience_match_percentage || 0,
        keyPhrases: data?.key_phrases || [],
        createdAt: data?.created_at || new Date().toISOString()
      };

      // Update local state
      setRatings((prevRatings) => [...prevRatings, newRating]);
      
      // Also update the match score in the job_applications table
      await supabase
        .from('job_applications' as any)
        .update({ 
          match_score: newRating.overallMatchPercentage,
          Skills: newRating.skillsMatchPercentage,
          Education: newRating.educationMatchPercentage,
          Relevance: newRating.experienceMatchPercentage,
          Overall: newRating.overallMatchPercentage
        })
        .eq('id', rating.applicantId);
      
      // Update the applicant's scores in local state
      setApplicants(prevApplicants => 
        prevApplicants.map(app => 
          app.id === rating.applicantId 
            ? { 
                ...app, 
                matchScore: newRating.overallMatchPercentage,
                Skills: newRating.skillsMatchPercentage,
                Education: newRating.educationMatchPercentage,
                Relevance: newRating.experienceMatchPercentage,
                Overall: newRating.overallMatchPercentage
              }
            : app
        )
      );
      
      console.log("Added new rating:", newRating);
      return newRating;
    } catch (error) {
      console.error("Error adding rating:", error);
      toast({
        title: "Error",
        description: "Failed to analyze application",
        variant: "destructive",
      });
      
      // Fall back to local creation for development
      const newRating: Rating = {
        ...rating,
        id: `${ratings.length + 1}`,
        createdAt: new Date().toISOString()
      };
      
      setRatings([...ratings, newRating]);
      return newRating;
    }
  };

  const getApplicantsByJobId = (jobId: string) => {
    return applicants.filter(applicant => applicant.jobId === jobId);
  };

  const getRatingByApplicantId = (applicantId: string) => {
    return ratings.find(rating => rating.applicantId === applicantId) || null;
  };

  const getApplicantsByUserId = (userId: string) => {
    return applicants.filter(applicant => applicant.userId === userId);
  };

  // Function to get the resume download URL
  const getResumeDownloadUrl = async (filePath: string) => {
    try {
      const maxRetries = 3;
      let currentRetry = 0;
      let downloadUrl = null;
      
      while (currentRetry < maxRetries && !downloadUrl) {
        try {
          const { data, error } = await supabase
            .storage
            .from('resumes')
            .createSignedUrl(filePath, 60); // URL valid for 60 seconds
          
          if (error) {
            throw error;
          }
          
          downloadUrl = data.signedUrl;
        } catch (err) {
          currentRetry++;
          
          if (currentRetry >= maxRetries) {
            throw err;
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return downloadUrl;
    } catch (error) {
      console.error("Error getting download URL:", error);
      toast({
        title: "Download failed",
        description: "Could not generate download URL for the resume",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    applicants,
    ratings,
    loading,
    error,
    addApplication,
    updateApplicationStatus,
    addRating,
    getApplicantsByJobId,
    getRatingByApplicantId,
    getApplicantsByUserId,
    getResumeDownloadUrl,
    refreshData: fetchApplicantsAndRatings  // Export the refresh function
  };
};
