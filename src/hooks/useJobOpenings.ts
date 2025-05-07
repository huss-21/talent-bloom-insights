
import { useState, useEffect } from "react";
import { JobOpening } from "@/types";

// Mock data for job openings
const MOCK_JOB_OPENINGS: JobOpening[] = [
  {
    id: "1",
    title: "Frontend Developer",
    description: "We are looking for an experienced Frontend Developer proficient in React, TypeScript, and modern CSS frameworks.",
    department: "Engineering",
    criteria: {
      "React": 35,
      "TypeScript": 25,
      "CSS": 20,
      "Testing": 10,
      "Communication": 10
    },
    status: "open",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()  // 2 days ago
  },
  {
    id: "2",
    title: "Backend Engineer",
    description: "Looking for a backend developer with strong experience in Node.js, database design, and API development.",
    department: "Engineering",
    criteria: {
      "Node.js": 30,
      "Database Design": 25,
      "API Development": 25,
      "Problem Solving": 10,
      "Communication": 10
    },
    status: "open",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()  // 5 days ago
  },
  {
    id: "3",
    title: "UX Designer",
    description: "We need a creative UX Designer with experience in user research, wireframing, and prototyping.",
    department: "Design",
    criteria: {
      "User Research": 30,
      "Wireframing": 25,
      "Prototyping": 25,
      "Visual Design": 10,
      "Communication": 10
    },
    status: "open",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()  // 3 days ago
  },
  {
    id: "4",
    title: "Project Manager",
    description: "Seeking an experienced Project Manager to lead cross-functional teams and deliver complex projects.",
    department: "Operations",
    criteria: {
      "Project Planning": 25,
      "Team Leadership": 25,
      "Risk Management": 20,
      "Stakeholder Management": 20,
      "Communication": 10
    },
    status: "closed",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()  // 15 days ago
  },
  {
    id: "5",
    title: "Data Scientist",
    description: "Looking for a Data Scientist with strong statistical analysis and machine learning skills.",
    department: "Data",
    criteria: {
      "Python": 25,
      "Statistical Analysis": 25,
      "Machine Learning": 25,
      "Data Visualization": 15,
      "Communication": 10
    },
    status: "open",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()  // 1 day ago
  }
];

export const useJobOpenings = () => {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    const loadJobs = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setJobOpenings(MOCK_JOB_OPENINGS);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const addJob = async (job: Omit<JobOpening, "id" | "createdAt" | "updatedAt">) => {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const now = new Date().toISOString();
    const newJob: JobOpening = {
      ...job,
      id: `${jobOpenings.length + 1}`,
      createdAt: now,
      updatedAt: now
    };

    setJobOpenings([...jobOpenings, newJob]);
    return newJob;
  };

  const updateJobStatus = async (id: string, status: "open" | "closed") => {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setJobOpenings(
      jobOpenings.map(job => 
        job.id === id 
          ? { ...job, status, updatedAt: new Date().toISOString() } 
          : job
      )
    );
  };

  const getJobById = (id: string) => {
    return jobOpenings.find(job => job.id === id) || null;
  };

  return {
    jobOpenings,
    loading,
    addJob,
    updateJobStatus,
    getJobById
  };
};
