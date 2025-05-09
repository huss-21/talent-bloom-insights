
import { useState, useEffect } from "react";
import { Applicant, Rating } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Mock data for applicants
const MOCK_APPLICANTS: Applicant[] = [
  {
    id: "1",
    userId: "2", // John Applicant
    jobId: "1", // Frontend Developer
    resumeUrl: "/mock-resume.pdf",
    applicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: "2",
    userId: "3", // Mock user
    jobId: "1", // Frontend Developer
    resumeUrl: "/mock-resume-2.pdf",
    applicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: "3",
    userId: "4", // Mock user
    jobId: "2", // Backend Engineer
    resumeUrl: "/mock-resume-3.pdf",
    applicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
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

  // Fetch applicants and ratings from Supabase
  useEffect(() => {
    const fetchApplicantsAndRatings = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch job applications from the new table
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*')
          .order('applied_at', { ascending: false });

        if (applicationsError) {
          throw applicationsError;
        }

        // 2. Transform data to match our Applicant type
        let transformedApplicants: Applicant[] = [];
        
        if (!applicationsData || applicationsData.length === 0) {
          console.log("No applications found in database, using mock data");
          setApplicants(MOCK_APPLICANTS);
        } else {
          transformedApplicants = applicationsData.map((app) => ({
            id: app.id,
            userId: app.user_id,
            jobId: app.job_id,
            fullName: app.full_name,
            email: app.email,
            resumeUrl: app.resume_url || '',
            applicationDate: app.applied_at,
            status: app.status,
            matchScore: app.match_score
          }));
          
          setApplicants(transformedApplicants);
          console.log("Fetched applications:", transformedApplicants);
        }

        // 3. Fetch ratings from the database
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('ratings')
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
          const transformedRatings: Rating[] = ratingsData.map((rating) => {
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
      } catch (error) {
        console.error("Error fetching applicants data:", error);
        toast({
          title: "Error",
          description: "Failed to load applicants data. Using mock data instead.",
          variant: "destructive",
        });
        
        // Fall back to mock data if there's an error
        setApplicants(MOCK_APPLICANTS);
        setRatings(MOCK_RATINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicantsAndRatings();
  }, []);

  // Add a new application to the database
  const addApplication = async (application: {
    userId: string;
    jobId: string;
    fullName: string;
    email: string;
    resumeUrl?: string;
    coverLetter?: string;
  }) => {
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          user_id: application.userId,
          job_id: application.jobId,
          full_name: application.fullName,
          email: application.email,
          resume_url: application.resumeUrl || null,
          cover_letter: application.coverLetter || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transform to our Applicant type
      const newApplicant: Applicant = {
        id: data.id,
        userId: data.user_id,
        jobId: data.job_id,
        fullName: data.full_name,
        email: data.email,
        resumeUrl: data.resume_url || '',
        applicationDate: data.applied_at,
        status: data.status,
        matchScore: data.match_score
      };

      // Update local state
      setApplicants((prevApplicants) => [newApplicant, ...prevApplicants]);
      console.log("Added new application:", newApplicant);
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
        .from('job_applications')
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
        .from('ratings')
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
        id: data.id,
        applicantId: data.applicant_id,
        criteriaScores: data.criteria_scores as Record<string, number>,
        overallMatchPercentage: data.overall_match_percentage,
        skillsMatchPercentage: data.skills_match_percentage,
        educationMatchPercentage: data.education_match_percentage,
        experienceMatchPercentage: data.experience_match_percentage,
        keyPhrases: data.key_phrases,
        createdAt: data.created_at
      };

      // Update local state
      setRatings((prevRatings) => [...prevRatings, newRating]);
      
      // Also update the match score in the job_applications table
      await supabase
        .from('job_applications')
        .update({ match_score: newRating.overallMatchPercentage })
        .eq('id', rating.applicantId);
      
      // Update the applicant's matchScore in the local state
      setApplicants(prevApplicants => 
        prevApplicants.map(app => 
          app.id === rating.applicantId 
            ? { ...app, matchScore: newRating.overallMatchPercentage }
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

  return {
    applicants,
    ratings,
    loading,
    addApplication,
    updateApplicationStatus,
    addRating,
    getApplicantsByJobId,
    getRatingByApplicantId,
    getApplicantsByUserId
  };
};
