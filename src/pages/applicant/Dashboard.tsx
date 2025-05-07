
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Briefcase, Upload, FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ApplicantDashboard = () => {
  const { currentUser } = useAuth();
  const { jobOpenings } = useJobOpenings();
  const { applicants, ratings, getApplicantsByUserId } = useApplicants();
  const navigate = useNavigate();
  
  // Get the current user's applications
  const userApplications = currentUser ? getApplicantsByUserId(currentUser.id) : [];
  
  // Count stats
  const openJobs = jobOpenings.filter(job => job.status === "open").length;
  const userApplicationCount = userApplications.length;
  const analyzedApplications = userApplications.filter(
    app => ratings.some(rating => rating.applicantId === app.id)
  ).length;
  
  // Get most recent application
  const mostRecentApplication = userApplications.length > 0
    ? userApplications.sort(
        (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
      )[0]
    : null;
  
  const mostRecentJob = mostRecentApplication
    ? jobOpenings.find(job => job.id === mostRecentApplication.jobId)
    : null;
  
  const mostRecentRating = mostRecentApplication
    ? ratings.find(rating => rating.applicantId === mostRecentApplication.id)
    : null;
  
  // Get best match application
  const bestMatch = userApplications.length > 0
    ? userApplications.reduce((best, current) => {
        const bestRating = best ? ratings.find(r => r.applicantId === best.id) : null;
        const currentRating = ratings.find(r => r.applicantId === current.id);
        
        if (!bestRating && currentRating) return current;
        if (!currentRating) return best;
        
        return currentRating.overallMatchPercentage > bestRating.overallMatchPercentage ? current : best;
      }, null as null | typeof userApplications[0])
    : null;
  
  const bestMatchJob = bestMatch
    ? jobOpenings.find(job => job.id === bestMatch.jobId)
    : null;
  
  const bestMatchRating = bestMatch
    ? ratings.find(rating => rating.applicantId === bestMatch.id)
    : null;
  
  return (
    <MainLayout roles={["applicant"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Applicant Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {currentUser?.name}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => navigate("/applicant/jobs")} className="bg-corporate-blue hover:bg-corporate-blue-light">
              <Briefcase className="mr-2 h-4 w-4" /> Browse Jobs
            </Button>
            <Button onClick={() => navigate("/applicant/upload")} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Upload Resume
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openJobs}</div>
              <p className="text-xs text-muted-foreground">
                Positions currently accepting applications
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userApplicationCount}</div>
              <p className="text-xs text-muted-foreground">
                {analyzedApplications} with analysis completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Best Match Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bestMatchRating ? `${bestMatchRating.overallMatchPercentage}%` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {bestMatchJob ? `For ${bestMatchJob.title}` : "No matches yet"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          
          {userApplications.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">No Applications Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You haven't applied for any positions yet. Browse open positions and submit your resume.
                  </p>
                  <Button onClick={() => navigate("/applicant/jobs")} className="mt-4 bg-corporate-blue hover:bg-corporate-blue-light">
                    Browse Open Positions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Most Recent Application */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Most Recent Application</CardTitle>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>
                    {mostRecentApplication 
                      ? `Applied on ${format(new Date(mostRecentApplication.applicationDate), "MMM d, yyyy")}`
                      : "No recent applications"}
                  </CardDescription>
                </CardHeader>
                
                {mostRecentJob && (
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{mostRecentJob.title}</h3>
                          <Badge variant={mostRecentJob.status === "open" ? "default" : "secondary"}>
                            {mostRecentJob.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mostRecentJob.department}</p>
                      </div>
                      
                      {mostRecentRating ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Match Score:</span>
                            <span className="font-medium">{mostRecentRating.overallMatchPercentage}%</span>
                          </div>
                          <Progress value={mostRecentRating.overallMatchPercentage} className="h-2" />
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-amber-600">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Resume analysis pending
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
                
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/applicant/applications")}>
                    <FileText className="mr-2 h-4 w-4" /> View Application Details
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Best Match */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Best Match</CardTitle>
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>
                    Your application with the highest match percentage
                  </CardDescription>
                </CardHeader>
                
                {bestMatchJob && bestMatchRating ? (
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{bestMatchJob.title}</h3>
                          <Badge variant={bestMatchJob.status === "open" ? "default" : "secondary"}>
                            {bestMatchJob.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{bestMatchJob.department}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Match Score:</span>
                          <span className="font-medium text-corporate-teal">{bestMatchRating.overallMatchPercentage}%</span>
                        </div>
                        <Progress value={bestMatchRating.overallMatchPercentage} className="h-2 bg-muted" />
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Your Strengths:</h4>
                        <div className="space-y-1">
                          {Object.entries(bestMatchRating.criteriaScores)
                            .sort(([_, a], [__, b]) => b - a)
                            .slice(0, 3)
                            .map(([criterion, score]) => (
                              <div key={criterion} className="flex items-center justify-between text-sm">
                                <span>{criterion}</span>
                                <span className={score >= 80 ? "text-corporate-teal font-medium" : ""}>{score}%</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        No scored applications yet
                      </p>
                    </div>
                  </CardContent>
                )}
                
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/applicant/applications")}>
                    <FileText className="mr-2 h-4 w-4" /> View All Applications
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
        
        {/* Recommended Jobs */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recommended Jobs</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobOpenings
              .filter(job => job.status === "open")
              .slice(0, 3)
              .map(job => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>{job.department}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Key Skills Required:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(job.criteria).slice(0, 3).map(([name, weight]) => (
                          <Badge key={name} variant="outline" className="bg-corporate-gray-100">
                            {name}
                          </Badge>
                        ))}
                        {Object.keys(job.criteria).length > 3 && (
                          <Badge variant="outline">+{Object.keys(job.criteria).length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-corporate-blue hover:bg-corporate-blue-light"
                      onClick={() => navigate(`/applicant/jobs?id=${job.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => navigate("/applicant/jobs")}>
              View All Open Positions
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ApplicantDashboard;
