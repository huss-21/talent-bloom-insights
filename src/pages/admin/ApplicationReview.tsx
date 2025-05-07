
import React, { useState } from "react";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { User, FileText, CheckCircle, BarChart, Download } from "lucide-react";

const ApplicationReview = () => {
  const { jobOpenings } = useJobOpenings();
  const { applicants, ratings } = useApplicants();
  const [selectedJob, setSelectedJob] = useState<string>(jobOpenings[0]?.id || "");
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  
  const jobApplicants = selectedJob 
    ? applicants.filter(app => app.jobId === selectedJob)
    : [];
  
  const selectedJobData = selectedJob 
    ? jobOpenings.find(job => job.id === selectedJob)
    : null;
  
  const selectedApplicant = selectedApplicantId 
    ? applicants.find(app => app.id === selectedApplicantId)
    : null;
  
  const selectedRating = selectedApplicant
    ? ratings.find(rating => rating.applicantId === selectedApplicant.id) 
    : null;
  
  // Generate chart data for selected applicant's criteria scores
  const getCriteriaChartData = () => {
    if (!selectedJobData || !selectedRating) return [];
    
    const jobCriteria = selectedJobData.criteria;
    const applicantScores = selectedRating.criteriaScores;
    
    return Object.keys(jobCriteria).map(criterion => {
      const required = jobCriteria[criterion];
      const score = applicantScores[criterion] || 0;
      
      return {
        name: criterion,
        required,
        score,
      };
    });
  };
  
  // Create match percentage chart data
  const getMatchChartData = () => {
    if (!selectedRating) return [];
    
    return [
      { name: "Match", value: selectedRating.overallMatchPercentage },
      { name: "Gap", value: 100 - selectedRating.overallMatchPercentage }
    ];
  };
  
  const COLORS = ["#285e61", "#e2e8f0"];
  
  return (
    <MainLayout roles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Review</h1>
          <p className="text-muted-foreground">Review and analyze job applications.</p>
        </div>
        
        <Tabs defaultValue="review" className="space-y-4">
          <TabsList>
            <TabsTrigger value="review">Review Applications</TabsTrigger>
            <TabsTrigger value="compare">Compare Top Candidates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="review" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Job Selection */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Select Job Opening</CardTitle>
                  <CardDescription>Choose a job to review applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {jobOpenings.map(job => (
                      <div 
                        key={job.id} 
                        className={`p-3 rounded-md cursor-pointer border ${selectedJob === job.id ? 'border-corporate-teal bg-corporate-teal/10' : 'border-border'}`}
                        onClick={() => {
                          setSelectedJob(job.id);
                          setSelectedApplicantId(null);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">{job.department}</p>
                          </div>
                          <Badge variant={job.status === "open" ? "default" : "secondary"}>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm">
                          {applicants.filter(app => app.jobId === job.id).length} applicant(s)
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Applicants List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Applicants</CardTitle>
                  <CardDescription>
                    {selectedJobData ? `Applications for ${selectedJobData.title}` : "Select a job to view applicants"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedJob ? (
                    <p className="text-muted-foreground">Please select a job opening first</p>
                  ) : jobApplicants.length === 0 ? (
                    <p className="text-muted-foreground">No applications for this position yet</p>
                  ) : (
                    <div className="space-y-2">
                      {jobApplicants.map(applicant => {
                        const applicantRating = ratings.find(r => r.applicantId === applicant.id);
                        const matchPercentage = applicantRating ? applicantRating.overallMatchPercentage : 0;
                        
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
                                  <h3 className="font-medium">Applicant #{applicant.id}</h3>
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
                  )}
                </CardContent>
              </Card>
              
              {/* Applicant Detail */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Applicant Details</CardTitle>
                  <CardDescription>
                    {selectedApplicant ? `Details for Applicant #${selectedApplicant.id}` : "Select an applicant to view details"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedApplicant ? (
                    <p className="text-muted-foreground">Please select an applicant to view details</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 rounded-full bg-corporate-blue flex items-center justify-center text-white">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">Applicant #{selectedApplicant.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(selectedApplicant.applicationDate), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <Button variant="outline" className="w-full" size="sm">
                          <FileText className="mr-2 h-4 w-4" /> View Resume
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Match Analysis</h4>
                        {selectedRating ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Overall Match:</span>
                              <span className={`font-medium ${selectedRating.overallMatchPercentage >= 80 ? 'text-green-600' : selectedRating.overallMatchPercentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                {selectedRating.overallMatchPercentage}%
                              </span>
                            </div>
                            
                            <div className="h-[100px] my-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getMatchChartData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={40}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {getMatchChartData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <div>
                              <h4 className="font-medium mb-2">Key Matching Phrases</h4>
                              <ul className="text-sm space-y-1">
                                {selectedRating.keyPhrases.map((phrase, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-corporate-teal mt-0.5 flex-shrink-0" />
                                    <span>{phrase}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No analysis data available</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Criteria Details */}
            {selectedRating && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills Analysis</CardTitle>
                  <CardDescription>
                    Detailed breakdown of the applicant's match against job criteria
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-4">Criteria Scores</h4>
                      <div className="space-y-4">
                        {Object.entries(selectedRating.criteriaScores).map(([criterion, score]) => (
                          <div key={criterion}>
                            <div className="flex items-center justify-between mb-1">
                              <span>{criterion}</span>
                              <span className={`font-medium ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</span>
                            </div>
                            <Progress value={score} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Criteria Chart</h4>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getCriteriaChartData()}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="score"
                              nameKey="name"
                              label={({ name, score }) => `${name}: ${score}%`}
                            >
                              {getCriteriaChartData().map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    index % 4 === 0 ? "#1a365d" :
                                    index % 4 === 1 ? "#285e61" :
                                    index % 4 === 2 ? "#2a4365" :
                                    "#d69e2e"
                                  } 
                                />
                              ))}
                            </Pie>
                            <Legend />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Compare Top Candidates</CardTitle>
                <CardDescription>Side-by-side comparison of top applicants for selected job</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="text-center p-6 border border-dashed rounded-md">
                    <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 font-semibold">Candidate Comparison</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select at least two candidates from the review tab to compare them.
                    </p>
                    <Button variant="outline" className="mt-4">
                      Select Candidates to Compare
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ApplicationReview;
