
import React from "react";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
import { useJobs } from "@/hooks/useJobs"; // Added useJobs hook
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  BarChart, 
  ChevronDown, 
  CalendarCheck,
  AlertTriangle,
  Briefcase
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ApplicationStatus = () => {
  const { jobOpenings } = useJobOpenings();
  const { jobs } = useJobs(); // Added jobs from useJobs
  const { applicants, ratings, getApplicantsByUserId, getResumeDownloadUrl } = useApplicants();
  const { currentUser } = useAuth();
  
  // Get current user's applications
  const userApplications = currentUser ? getApplicantsByUserId(currentUser.id) : [];
  
  // Format application data with job info
  const applicationsWithDetails = userApplications.map(application => {
    // Try to get job info from both sources for maximum compatibility
    const jobOpening = jobOpenings.find(job => job.id === application.jobId);
    const job = jobs.find(job => job.id === application.jobId);
    const rating = ratings.find(rating => rating.applicantId === application.id);
    
    return {
      ...application,
      jobOpening,
      job,
      rating
    };
  }).sort((a, b) => {
    // Sort by date, most recent first
    return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
  });
  
  // Split applications into active and archived
  const activeApplications = applicationsWithDetails.filter(app => 
    (app.jobOpening && app.jobOpening.status === "open") || 
    (app.job && app.job.status === true)
  );
  
  const archivedApplications = applicationsWithDetails.filter(app => 
    (app.jobOpening && app.jobOpening.status === "closed") || 
    (app.job && app.job.status === false)
  );
  
  return (
    <MainLayout roles={["applicant"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Track the status of your job applications</p>
        </div>
        
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active Applications 
              {activeApplications.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeApplications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived 
              {archivedApplications.length > 0 && (
                <Badge variant="secondary" className="ml-2">{archivedApplications.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {activeApplications.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-semibold">No Active Applications</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You don't have any active job applications at the moment.
                    </p>
                    <Button className="mt-4 bg-corporate-blue hover:bg-corporate-blue-light">
                      Browse Open Positions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeApplications.map(app => (
                  <ApplicationCard 
                    key={app.id} 
                    application={app} 
                    getResumeDownloadUrl={getResumeDownloadUrl}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="archived">
            {archivedApplications.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-semibold">No Archived Applications</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      None of your applications have been archived yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {archivedApplications.map(app => (
                  <ApplicationCard 
                    key={app.id} 
                    application={app} 
                    getResumeDownloadUrl={getResumeDownloadUrl}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

interface ApplicationCardProps {
  application: {
    id: string;
    applicationDate: string;
    resumeUrl: string;
    resumeFilePath?: string;
    jobDescription?: string;
    jobOpening?: {
      id: string;
      title: string;
      department: string;
      status: "open" | "closed";
      criteria: Record<string, number>;
    };
    job?: {
      id: string;
      title: string;
      department: string;
      description: string;
      status: boolean;
      skills_and_requirements: Record<string, number>;
    };
    rating?: {
      overallMatchPercentage: number;
      criteriaScores: Record<string, number>;
      keyPhrases: string[];
    };
  };
  getResumeDownloadUrl: (filePath: string) => Promise<string | null>;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, getResumeDownloadUrl }) => {
  // Use either jobOpening or job, depending on what's available
  const jobDetails = application.jobOpening || application.job;
  if (!jobDetails) return null;
  
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  
  const { rating, applicationDate, resumeUrl, resumeFilePath } = application;
  const hasRating = !!rating;
  const applicationStatus = hasRating ? "analyzed" : "pending";
  
  // Get the job title and department from the appropriate object
  const jobTitle = application.jobOpening ? application.jobOpening.title : application.job?.title;
  const jobDepartment = application.jobOpening ? application.jobOpening.department : application.job?.department;
  const jobStatus = application.jobOpening ? application.jobOpening.status : (application.job?.status ? "open" : "closed");
  
  // Helper function to get the appropriate color class based on score
  const getScoreColorClass = (score: number) => {
    return score >= 80 ? 'bg-green-600' : 
           score >= 60 ? 'bg-amber-600' : 
           'bg-red-600';
  };
  
  // Handle resume download
  const handleDownloadResume = async () => {
    if (!resumeFilePath) return;
    
    try {
      const url = await getResumeDownloadUrl(resumeFilePath);
      if (url) {
        setDownloadUrl(url);
        // Open in a new tab
        window.open(url, '_blank');
      } else {
        console.error("Failed to get download URL");
      }
    } catch (error) {
      console.error("Error downloading resume:", error);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{jobTitle}</CardTitle>
            <CardDescription>{jobDepartment}</CardDescription>
          </div>
          <Badge variant={jobStatus === "open" || jobStatus === true ? "default" : "secondary"}>
            {typeof jobStatus === "string" 
              ? jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1) 
              : jobStatus ? "Open" : "Closed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-4">
          {/* Application Status */}
          <div className="flex items-center gap-2 text-sm">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            <span>Applied on {format(new Date(applicationDate), "MMMM d, yyyy")}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {applicationStatus === "analyzed" ? (
              <CheckCircle className="h-4 w-4 text-corporate-teal" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
            <span>
              {applicationStatus === "analyzed" 
                ? "Resume analyzed" 
                : "Analysis pending"}
            </span>
          </div>
          
          {/* Job Description Summary */}
          {application.jobDescription && (
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="jobDescription">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Job Description
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-3 bg-muted/30 rounded-md text-sm">
                    <p className="whitespace-pre-wrap">{application.jobDescription}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {/* Match Score */}
          {hasRating && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Match Score:</span>
                <span className={`text-sm font-medium ${rating.overallMatchPercentage >= 80 ? 'text-green-600' : rating.overallMatchPercentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {rating.overallMatchPercentage}%
                </span>
              </div>
              <div className="relative w-full">
                <Progress 
                  value={rating.overallMatchPercentage} 
                  className={`h-2 ${getScoreColorClass(rating.overallMatchPercentage)}`}
                />
              </div>
            </div>
          )}
          
          {/* Detailed Analysis */}
          {hasRating && (
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="skills">
                <AccordionTrigger className="text-sm">
                  View Skills Analysis
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {Object.entries(rating.criteriaScores).map(([criterion, score]) => (
                    <div key={criterion}>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span>{criterion}</span>
                        <span className={`${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {score}%
                        </span>
                      </div>
                      <div className="relative w-full">
                        <Progress 
                          value={score} 
                          className={`h-1.5 ${getScoreColorClass(score)}`}
                        />
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="matches">
                <AccordionTrigger className="text-sm">
                  View Matching Key Points
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {rating.keyPhrases.map((phrase, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-corporate-teal flex-shrink-0 mt-0.5" />
                        <span>{phrase}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {/* Resume Download */}
          <div className="mt-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadResume}
              disabled={!resumeFilePath}
            >
              <FileText className="h-4 w-4 mr-2" /> View Resume
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationStatus;
