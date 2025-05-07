
import React from "react";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
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
  AlertTriangle 
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ApplicationStatus = () => {
  const { jobOpenings } = useJobOpenings();
  const { applicants, ratings, getApplicantsByUserId } = useApplicants();
  const { currentUser } = useAuth();
  
  // Get current user's applications
  const userApplications = currentUser ? getApplicantsByUserId(currentUser.id) : [];
  
  // Format application data with job info
  const applicationsWithDetails = userApplications.map(application => {
    const job = jobOpenings.find(job => job.id === application.jobId);
    const rating = ratings.find(rating => rating.applicantId === application.id);
    
    return {
      ...application,
      job,
      rating
    };
  }).sort((a, b) => {
    // Sort by date, most recent first
    return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
  });
  
  // Split applications into active and archived
  const activeApplications = applicationsWithDetails.filter(app => 
    app.job && app.job.status === "open"
  );
  
  const archivedApplications = applicationsWithDetails.filter(app => 
    app.job && app.job.status === "closed"
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
                  <ApplicationCard key={app.id} application={app} />
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
                  <ApplicationCard key={app.id} application={app} />
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
    job?: {
      id: string;
      title: string;
      department: string;
      status: "open" | "closed";
      criteria: Record<string, number>;
    };
    rating?: {
      overallMatchPercentage: number;
      criteriaScores: Record<string, number>;
      keyPhrases: string[];
    };
  };
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  if (!application.job) return null;
  
  const { job, rating, applicationDate, resumeUrl } = application;
  const hasRating = !!rating;
  const applicationStatus = hasRating ? "analyzed" : "pending";
  
  // Helper function to get the appropriate color class based on score
  const getScoreColorClass = (score: number) => {
    return score >= 80 ? 'bg-green-600' : 
           score >= 60 ? 'bg-amber-600' : 
           'bg-red-600';
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription>{job.department}</CardDescription>
          </div>
          <Badge variant={job.status === "open" ? "default" : "secondary"}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
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
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" /> View Resume
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationStatus;
