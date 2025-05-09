
import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useApplicants } from "@/hooks/useApplicants";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { format } from "date-fns";
import { User, FileText, Search, CheckCircle, Clock, XCircle, Download, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Applicant } from "@/types";
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
import { Skeleton } from "@/components/ui/skeleton";

const Applicants = () => {
  const { applicants, ratings, getRatingByApplicantId, loading, getResumeDownloadUrl } = useApplicants();
  const { jobOpenings, getJobById } = useJobOpenings();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter applicants based on search query
  const filteredApplicants = applicants.filter(applicant => {
    const job = getJobById(applicant.jobId);
    
    if (!job) return false;
    
    // Search through job title, job id, applicant name or email
    const searchFields = [
      job.title.toLowerCase(),
      job.id.toLowerCase(),
      applicant.id.toLowerCase(),
      applicant.fullName?.toLowerCase() || '',
      applicant.email?.toLowerCase() || ''
    ];
    
    return searchFields.some(field => field.includes(searchQuery.toLowerCase()));
  });

  // Filter based on active tab
  const displayedApplicants = filteredApplicants.filter(applicant => {
    if (activeTab === "all") return true;
    
    if (activeTab === "highMatch") {
      // Check for match score in the applicant or find it in ratings
      if (applicant.matchScore && applicant.matchScore >= 80) return true;
      
      const rating = getRatingByApplicantId(applicant.id);
      if (rating && rating.overallMatchPercentage >= 80) return true;
      
      return false;
    }
    
    if (activeTab === "recent") {
      // Get applications from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(applicant.applicationDate) >= oneWeekAgo;
    }

    if (activeTab === "pending") {
      return applicant.status === "pending";
    }
    
    return true;
  });

  // Handle resume download
  const handleDownloadResume = async (applicant: Applicant) => {
    if (!applicant.resumeFilePath) {
      toast({
        title: "Download Error",
        description: "Resume file path not found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const downloadUrl = await getResumeDownloadUrl(applicant.resumeFilePath);
      
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
  
  // Get score color class based on rating percentage
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "rejected":
        return <XCircle className="h-4 w-4 mr-1" />;
      case "pending":
      default:
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };

  useEffect(() => {
    console.log("All applicants:", applicants);
    console.log("Displayed applicants:", displayedApplicants);
  }, [applicants, displayedApplicants]);

  return (
    <MainLayout roles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Applicants</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all applicants across all job openings
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title, name or email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Tabs 
              defaultValue="all" 
              className="w-[400px]"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="highMatch">High Match</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Applicants ({loading ? "..." : displayedApplicants.length})</CardTitle>
              <CardDescription>
                Review all applicants and their match scores
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[160px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedApplicants.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No applicants found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Match Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedApplicants.map((applicant) => {
                      const job = getJobById(applicant.jobId);
                      const rating = getRatingByApplicantId(applicant.id);
                      const matchScore = applicant.matchScore || (rating ? rating.overallMatchPercentage : null);
                      
                      return (
                        <TableRow key={applicant.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-corporate-blue-light flex items-center justify-center text-white">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-medium">
                                  {applicant.fullName || `Applicant #${applicant.id.slice(0, 8)}`}
                                </span>
                                {applicant.email && (
                                  <p className="text-xs text-muted-foreground">{applicant.email}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {job ? (
                              <div className="max-w-[200px] truncate">
                                <span className="font-medium">{job.title}</span>
                                <p className="text-xs text-muted-foreground">{job.department}</p>
                              </div>
                            ) : (
                              "Unknown Job"
                            )}
                          </TableCell>
                          <TableCell>
                            {applicant.applicationDate ? format(new Date(applicant.applicationDate), "MMM d, yyyy") : "Unknown date"}
                          </TableCell>
                          <TableCell>
                            {matchScore !== null ? (
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${getScoreColorClass(matchScore)}`}>
                                  {matchScore}%
                                </span>
                                <div className="w-20">
                                  <Progress 
                                    value={matchScore} 
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not rated</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getStatusBadgeVariant(applicant.status || 'pending')}
                              className="flex items-center"
                            >
                              {getStatusIcon(applicant.status || 'pending')}
                              {applicant.status || "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {applicant.resumeFilePath && (
                                <Button size="sm" variant="outline" onClick={() => handleDownloadResume(applicant)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Resume
                                </Button>
                              )}
                              <Button asChild size="sm" variant="ghost">
                                <Link to={`/admin/jobs/${applicant.jobId}/applicants`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Applicants;
