
import { useState, useEffect } from "react";
import { Applicant, Rating } from "@/types";

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

  useEffect(() => {
    // In a real app, this would be an API call
    const loadApplicants = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setApplicants(MOCK_APPLICANTS);
        setRatings(MOCK_RATINGS);
      } finally {
        setLoading(false);
      }
    };

    loadApplicants();
  }, []);

  const addApplicant = async (applicant: Omit<Applicant, "id">) => {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newApplicant: Applicant = {
      ...applicant,
      id: `${applicants.length + 1}`
    };

    setApplicants([...applicants, newApplicant]);
    return newApplicant;
  };

  const addRating = async (rating: Omit<Rating, "id" | "createdAt">) => {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRating: Rating = {
      ...rating,
      id: `${ratings.length + 1}`,
      createdAt: new Date().toISOString()
    };

    setRatings([...ratings, newRating]);
    return newRating;
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
