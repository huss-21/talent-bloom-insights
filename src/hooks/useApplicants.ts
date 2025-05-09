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
        
        // Fetch applicants
        const { data: applicantsData, error: applicantsError } = await supabase
          .from('applicants')
          .select('*');

        if (applicantsError) {
          throw applicantsError;
        }

        // Transform data to match our Applicant type
        const transformedApplicants: Applicant[] = applicantsData.map((app) => ({
          id: app.id,
          userId: app.user_id,
          jobId: app.job_id,
          resumeUrl: app.resume_url,
          applicationDate: app.application_date
        }));
        
        setApplicants(transformedApplicants);

        // Fetch ratings
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('ratings')
          .select('*');

        if (ratingsError) {
          throw ratingsError;
        }

        // Transform data to match our Rating type
        const transformedRatings: Rating[] = ratingsData.map((rating) => ({
          id: rating.id,
          applicantId: rating.applicant_id,
          criteriaScores: rating.criteria_scores as Record<string, number>,
          overallMatchPercentage: rating.overall_match_percentage,
          skillsMatchPercentage: rating.skills_match_percentage,
          educationMatchPercentage: rating.education_match_percentage,
          experienceMatchPercentage: rating.experience_match_percentage,
          keyPhrases: rating.key_phrases,
          createdAt: rating.created_at
        }));
        
        setRatings(transformedRatings);
      } catch (error) {
        console.error("Error fetching applicants data:", error);
        toast({
          title: "Error",
          description: "Failed to load applicants data",
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

  // Add a new applicant to the database
  const addApplicant = async (applicant: Omit<Applicant, "id">) => {
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('applicants')
        .insert({
          user_id: applicant.userId,
          job_id: applicant.jobId,
          resume_url: applicant.resumeUrl,
          application_date: applicant.applicationDate
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
        resumeUrl: data.resume_url,
        applicationDate: data.application_date
      };

      // Update local state
      setApplicants((prevApplicants) => [...prevApplicants, newApplicant]);
      return newApplicant;
    } catch (error) {
      console.error("Error adding applicant:", error);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
      
      // Fall back to local creation for development
      const newApplicant: Applicant = {
        ...applicant,
        id: `${applicants.length + 1}`
      };
      
      setApplicants([...applicants, newApplicant]);
      return newApplicant;
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
        criteriaScores: data.criteria_scores,
        overallMatchPercentage: data.overall_match_percentage,
        skillsMatchPercentage: data.skills_match_percentage,
        educationMatchPercentage: data.education_match_percentage,
        experienceMatchPercentage: data.experience_match_percentage,
        keyPhrases: data.key_phrases,
        createdAt: data.created_at
      };

      // Update local state
      setRatings((prevRatings) => [...prevRatings, newRating]);
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
    addApplicant,
    addRating,
    getApplicantsByJobId,
    getRatingByApplicantId,
    getApplicantsByUserId
  };
};
