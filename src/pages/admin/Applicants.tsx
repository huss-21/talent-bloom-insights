
import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useApplicants } from "@/hooks/useApplicants";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { format } from "date-fns";
import { User, FileText, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

const Applicants = () => {
  const { applicants, ratings, getRatingByApplicantId } = useApplicants();
  const { jobOpenings, getJobById } = useJobOpenings();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter applicants based on search query
  const filteredApplicants = applicants.filter(applicant => {
    const job = getJobById(applicant.jobId);
    const rating = getRatingByApplicantId(applicant.id);
    
    // Search through job title or id
    return job?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           applicant.id.includes(searchQuery);
  });

  // Get score color class based on rating percentage
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

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
              placeholder="Search by job title or applicant ID..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Tabs defaultValue="all" className="w-[320px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="highMatch">High Match</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Applicants ({filteredApplicants.length})</CardTitle>
            <CardDescription>
              Review all applicants and their match scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplicants.length === 0 ? (
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
                    {filteredApplicants.map((applicant) => {
                      const job = getJobById(applicant.jobId);
                      const rating = getRatingByApplicantId(applicant.id);
                      const matchScore = rating ? rating.overallMatchPercentage : null;
                      
                      return (
                        <TableRow key={applicant.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-corporate-blue-light flex items-center justify-center text-white">
                                <User className="h-4 w-4" />
                              </div>
                              <span className="font-medium">Applicant #{applicant.id}</span>
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
                            {format(new Date(applicant.applicationDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {matchScore ? (
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${getScoreColorClass(matchScore)}`}>
                                  {matchScore}%
                                </span>
                                <div className="w-20">
                                  <Progress 
                                    value={matchScore} 
                                    className={`h-2 ${matchScore >= 80 ? 'bg-green-600' : 
                                              matchScore >= 60 ? 'bg-amber-600' : 
                                              'bg-red-600'}`}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not rated</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rating ? "default" : "secondary"}>
                              {rating ? "Analyzed" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
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
