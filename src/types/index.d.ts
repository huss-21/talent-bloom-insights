
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
}

export interface Rating {
  id: string;
  applicantId: string;
  criteriaScores: Record<string, number>;
  overallMatchPercentage: number;
  skillsMatchPercentage: number;
  educationMatchPercentage: number;
  experienceMatchPercentage: number;
  keyPhrases: string[];
  createdAt: string;
}
