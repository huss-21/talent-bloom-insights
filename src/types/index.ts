export type Role = "admin" | "applicant";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface JobOpening {
  id: string;
  title: string;
  description: string;
  department: string;
  criteria: Record<string, number>; // e.g. {"Python": 30, "Project Management": 25}
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface Applicant {
  id: string;
  userId: string;
  jobId: string;
  resumeUrl: string;
  applicationDate: string;
  fullName?: string;
  email?: string;
  status?: string;
  matchScore?: number | null;
  resumeFileName?: string;
  resumeFilePath?: string;
  nationalId?: string;
}

export interface Rating {
  id: string;
  applicantId: string;
  criteriaScores: Record<string, number>; // e.g. {"Python": 85, "Project Management": 70}
  overallMatchPercentage: number;
  skillsMatchPercentage: number;
  educationMatchPercentage: number;
  experienceMatchPercentage: number;
  keyPhrases: string[];
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  status: boolean;
  skills_and_requirements: Record<string, number>;
  created_at: string;
  updated_at: string;
}
