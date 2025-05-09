
import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useApplicants } from "@/hooks/useApplicants";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { format } from "date-fns";
import { User, FileText, Search, CheckCircle, Clock, XCircle, Download, RefreshCw, IdCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const Applicants = () => {
  const { applicants, loading, updateApplicationStatus, getResumeDownloadUrl } = useApplicants();
  const { jobOpenings, getJobById } = useJobOpenings();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter applicants based on search query
  const filteredApplicants = applicants.filter(applicant => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = applicant.fullName?.toLowerCase() || "";
    const email = applicant.email?.toLowerCase() || "";
    const nationalId = applicant.nationalId?.toLowerCase() || "";
    const job = getJobById(applicant.jobId);
    const jobTitle = job?.title?.toLowerCase() || "";
    
    return fullName.includes(searchLower) || 
           email.includes(searchLower) || 
           nationalId.includes(searchLower) ||
           jobTitle.includes(searchLower);
  });
  
  // Further filter based on status tab
  const displayedApplicants = filteredApplicants.filter(applicant => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return applicant.status === "pending";
    if (activeTab === "reviewed") return applicant.status === "reviewed";
    if (activeTab === "rejected") return applicant.status === "rejected";
    if (activeTab === "hired") return applicant.status === "hired";
    return true;
  });
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>;
      case "reviewed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">
          <CheckCircle className="mr-1 h-3 w-3" /> Reviewed
        </Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800">
          <XCircle className="mr-1 h-3 w-3" /> Rejected
        </Badge>;
      case "hired":
        return <Badge variant="outline" className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" /> Hired
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    try {
      const success = await updateApplicationStatus(applicantId, newStatus);
      if (success) {
        toast({
          title: "Status Updated",
          description: `Application status changed to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const handleDownloadResume = async (applicant: any) => {
    try {
      if (!applicant.resumeFilePath) {
        toast({
          title: "Error",
          description: "No resume file found for this applicant",
          variant: "destructive",
        });
        return;
      }
      
      const url = await getResumeDownloadUrl(applicant.resumeFilePath);
      
      if (url) {
        // Open in new tab
        window.open(url, '_blank');
      } else {
        throw new Error("Could not generate download URL");
      }
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast({
        title: "Error",
        description: "Failed to download resume",
        variant: "destructive",
      });
    }
  };
  
  return (
    <MainLayout roles={["admin"]}>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Applicant Management</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search applicants by name, email, ID or job title..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Select
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
            </SelectContent>
          </Select>
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
              <div className="text-center py-4">Loading applicants...</div>
            ) : displayedApplicants.length === 0 ? (
              <div className="text-center py-4">No applicants found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Job Position</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Match Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedApplicants.map((applicant) => {
                      const job = getJobById(applicant.jobId);
                      return (
                        <TableRow key={applicant.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{applicant.fullName}</p>
                                <p className="text-sm text-muted-foreground">{applicant.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <IdCard className="h-4 w-4 mr-2 text-muted-foreground" />
                              {applicant.nationalId || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {job ? (
                              <div>
                                <p className="font-medium">{job.title}</p>
                                <p className="text-sm text-muted-foreground">{job.department}</p>
                              </div>
                            ) : (
                              "Unknown job"
                            )}
                          </TableCell>
                          <TableCell>
                            {applicant.applicationDate 
                              ? format(new Date(applicant.applicationDate), "MMM d, yyyy") 
                              : "Unknown"
                            }
                          </TableCell>
                          <TableCell>
                            {applicant.matchScore !== null && applicant.matchScore !== undefined ? (
                              <Badge variant={applicant.matchScore > 70 ? "default" : "outline"} className="font-mono">
                                {applicant.matchScore}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Not analyzed</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(applicant.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadResume(applicant)}
                                title="Download Resume"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              
                              <Select
                                value={applicant.status}
                                onValueChange={(value) => handleStatusChange(applicant.id, value)}
                              >
                                <SelectTrigger className="w-[110px] h-9">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="reviewed">Reviewed</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                  <SelectItem value="hired">Hired</SelectItem>
                                </SelectContent>
                              </Select>
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
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Showing {displayedApplicants.length} of {filteredApplicants.length} applicants
            </p>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Applicants;
