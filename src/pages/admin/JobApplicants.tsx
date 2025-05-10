
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
import { format } from "date-fns";
import { ArrowLeft, Download, FileText, User, Loader, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ApplicantRatingCharts } from "@/components/ApplicantRatingCharts";
import { Skeleton } from "@/components/ui/skeleton";

const JobApplicants = () => {
  const { jobId } = useParams();
  const { getJobById, loading: jobLoading } = useJobOpenings();
  const { applicants, ratings, getApplicantsByJobId, getRatingByApplicantId, getResumeDownloadUrl, loading: applicantsLoading } = useApplicants();
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const isLoading = jobLoading || applicantsLoading;
  const job = jobId ? getJobById(jobId) : null;
  const jobApplicants = jobId ? getApplicantsByJobId(jobId) : [];
  
  const selectedApplicant = selectedApplicantId 
    ? applicants.find(app => app.id === selectedApplicantId) 
    : null;
  
  const selectedRating = selectedApplicant
    ? getRatingByApplicantId(selectedApplicant.id)
    : null;
  
  // Select first applicant by default if available
  useEffect(() => {
    if (jobApplicants.length > 0 && !selectedApplicantId) {
      setSelectedApplicantId(jobApplicants[0].id);
    }
  }, [jobApplicants, selectedApplicantId]);

  // Handle resume download
  const handleDownloadResume = async () => {
    if (!selectedApplicant || !selectedApplicant.resumeFilePath) {
      toast({
        title: "Download Error",
        description: "Resume file not available",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const downloadUrl = await getResumeDownloadUrl(selectedApplicant.resumeFilePath);
      
      if (!downloadUrl) {
        toast({
          title: "Download Error",
          description: "Could not generate download URL",
          variant: "destructive",
        });
        return;
      }
      
      // Open the download URL in a new tab
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error("Resume download error:", error);
      toast({
        title: "Download Error",
        description: "Failed to download resume",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <MainLayout roles={["admin"]}>
        <div className="space-y-4 p-6">
          <div className="flex items-center space-x-2">
            <Link to="/admin/jobs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <Loader className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-lg">Loading job applicants...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout roles={["admin"]}>
        <div className="space-y-4 p-6">
          <div className="flex items-center space-x-2">
            <Link to="/admin/jobs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Job opening not found.</p>
              <Button variant="default" className="mt-4" onClick={handleRetry}>
                Retry Loading
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout roles={["admin"]}>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Link to="/admin/jobs">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-4">{job.title}</h1>
            <p className="text-muted-foreground">
              {job.department} • {jobApplicants.length} Applicant{jobApplicants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Badge variant={job.status === "open" ? "default" : "secondary"} className="text-sm">
            {job.status ? "OPEN" : "CLOSED"}
          </Badge>
        </div>
        
        {jobApplicants.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No applicants have applied for this position yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Applicants</CardTitle>
                <CardDescription>
                  {jobApplicants.length} applicant{jobApplicants.length !== 1 ? "s" : ""} for this position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobApplicants.map(applicant => {
                    const applicantRating = getRatingByApplicantId(applicant.id);
                    const matchPercentage = applicant.Overall || 0;
                    
                    return (
                      <div 
                        key={applicant.id} 
                        className={`p-3 rounded-md cursor-pointer border ${selectedApplicantId === applicant.id ? 'border-corporate-teal bg-corporate-teal/10' : 'border-border'}`}
                        onClick={() => setSelectedApplicantId(applicant.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-corporate-blue-light flex items-center justify-center text-white">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-medium">{applicant.fullName || `Applicant #${applicant.id.slice(0, 8)}`}</h3>
                              <p className="text-xs text-muted-foreground">
                                Applied on {format(new Date(applicant.applicationDate), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Match Score:</span>
                            <span className={`font-medium ${matchPercentage >= 80 ? 'text-green-600' : matchPercentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                              {matchPercentage}%
                            </span>
                          </div>
                          <Progress value={matchPercentage} className="h-2 mt-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Applicant Details</CardTitle>
                <CardDescription>
                  {selectedApplicant ? `Details for ${selectedApplicant.fullName || `Applicant #${selectedApplicant.id.slice(0, 8)}`}` : "Select an applicant to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedApplicant ? (
                  <p className="text-muted-foreground">Please select an applicant to view details</p>
                ) : (
                  <div>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="resume">Resume & Analysis</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 rounded-full bg-corporate-blue flex items-center justify-center text-white">
                            <User className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{selectedApplicant.fullName || `Applicant #${selectedApplicant.id.slice(0, 8)}`}</h3>
                            <p className="text-sm text-muted-foreground">
                              Applied on {format(new Date(selectedApplicant.applicationDate), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Added job description display section */}
                        {selectedApplicant.jobDescription && (
                          <div>
                            <h4 className="font-medium mb-2">Job Description</h4>
                            <div className="p-4 bg-muted/50 rounded-md">
                              <p className="text-sm whitespace-pre-wrap">{selectedApplicant.jobDescription}</p>
                            </div>
                            <Separator className="my-4" />
                          </div>
                        )}
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium mb-4">Match Summary</h4>
                            <ApplicantRatingCharts 
                              skills={selectedApplicant.Skills}
                              education={selectedApplicant.Education}
                              relevance={selectedApplicant.Relevance}
                              overall={selectedApplicant.Overall}
                            />
                          </div>
                          
                          {selectedRating ? (
                            <div>
                              <h4 className="font-medium mb-4">Skills Analysis</h4>
                              <div className="space-y-4">
                                {Object.entries(selectedRating.criteriaScores).map(([criterion, score]) => (
                                  <div key={criterion}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span>{criterion}</span>
                                      <span className={`font-medium ${
                                        score >= 80 ? 'text-green-600' : 
                                        score >= 60 ? 'text-amber-600' : 
                                        'text-red-600'
                                      }`}>
                                        {score}%
                                      </span>
                                    </div>
                                    <Progress value={score} className="h-2" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          
                          {selectedRating?.keyPhrases && selectedRating.keyPhrases.length > 0 ? (
                            <div>
                              <h4 className="font-medium mb-4">Key Matching Phrases</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {selectedRating.keyPhrases.map((phrase, index) => (
                                  <li key={index} className="text-sm">{phrase}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          
                          {!selectedRating && (
                            <p className="text-muted-foreground">No detailed rating data available for this applicant.</p>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="resume" className="space-y-6 mt-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-medium">Resume</h4>
                          {selectedApplicant.resumeFilePath && (
                            <Button variant="outline" size="sm" onClick={handleDownloadResume}>
                              <Download className="mr-2 h-4 w-4" /> Download Resume
                            </Button>
                          )}
                        </div>
                        
                        <div className="border rounded-md p-8 flex flex-col items-center justify-center bg-gray-50 min-h-[300px]">
                          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                          {selectedApplicant.resumeFileName ? (
                            <div className="text-center">
                              <p className="text-sm font-medium">{selectedApplicant.resumeFileName}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Click the download button to view the resume.
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Resume preview not available. Click the download button to view the resume.
                            </p>
                          )}
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-4">Analysis Process</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            This resume was analyzed using an LLM to extract relevant skills and match them against the job criteria.
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Criteria</TableHead>
                                <TableHead>Job Requirement</TableHead>
                                <TableHead>Applicant Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedRating && Object.entries(selectedRating.criteriaScores).map(([criterion, score]) => {
                                const jobCriteriaWeight = job.criteria?.[criterion] || 0;
                                
                                return (
                                  <TableRow key={criterion}>
                                    <TableCell className="font-medium">{criterion}</TableCell>
                                    <TableCell>{jobCriteriaWeight}%</TableCell>
                                    <TableCell className={`font-medium ${
                                      score >= 80 ? 'text-green-600' : 
                                      score >= 60 ? 'text-amber-600' : 
                                      'text-red-600'
                                    }`}>
                                      {score}%
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              
                              {!selectedRating && (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                    No detailed ratings available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default JobApplicants;
