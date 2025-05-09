
import React, { useState, useEffect } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useApplicants } from "@/hooks/useApplicants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search, Filter, Calendar, Briefcase, Upload, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Job } from "@/types";

const JobBrowse = () => {
  const { jobs, loading } = useJobs();
  const { applicants, getApplicantsByUserId } = useApplicants();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const jobIdFromQuery = queryParams.get('id');
  
  // Set selected job from query parameter if available
  useEffect(() => {
    if (jobIdFromQuery) {
      const job = jobs.find(job => job.id === jobIdFromQuery);
      if (job) {
        setSelectedJob(job);
        setIsDialogOpen(true);
      }
    }
  }, [jobIdFromQuery, jobs]);
  
  // Load user applications
  useEffect(() => {
    if (currentUser) {
      const apps = getApplicantsByUserId(currentUser.id);
      setUserApplications(apps);
    }
  }, [currentUser, getApplicantsByUserId]);
  
  // Get all available departments
  const departments = Array.from(new Set(jobs.map(job => job.department)));
  
  // Filter jobs based on search and department filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = 
      selectedDepartments.length === 0 || 
      selectedDepartments.includes(job.department);
    
    return matchesSearch && matchesDepartment;
  });
  
  // Check if user has already applied for a job
  const hasAppliedToJob = (jobId: string) => {
    if (!currentUser || !userApplications.length) return false;
    return userApplications.some(app => app.jobId === jobId);
  };
  
  // Toggle department filter
  const toggleDepartment = (department: string) => {
    if (selectedDepartments.includes(department)) {
      setSelectedDepartments(selectedDepartments.filter(d => d !== department));
    } else {
      setSelectedDepartments([...selectedDepartments, department]);
    }
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDepartments([]);
  };
  
  const viewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
    
    // Update URL without full page reload
    const newUrl = job ? `/applicant/jobs?id=${job.id}` : '/applicant/jobs';
    window.history.pushState({}, '', newUrl);
  };
  
  const closeJobDetails = () => {
    setIsDialogOpen(false);
    setSelectedJob(null);
    
    // Remove query parameter from URL
    window.history.pushState({}, '', '/applicant/jobs');
  };
  
  const applyForJob = (jobId: string) => {
    navigate(`/applicant/upload?jobId=${jobId}`);
  };
  
  return (
    <MainLayout roles={["applicant"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Job Openings</h1>
          <p className="text-muted-foreground">Explore available positions and apply</p>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, description, or department..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="h-4 w-4" /> Filters
              {(searchQuery || selectedDepartments.length > 0) && (
                <Badge variant="secondary" className="ml-1">
                  {(searchQuery ? 1 : 0) + selectedDepartments.length}
                </Badge>
              )}
            </Button>
            
            {departments.map((department) => (
              <Button
                key={department}
                variant={selectedDepartments.includes(department) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDepartment(department)}
              >
                {department}
              </Button>
            ))}
            
            {(searchQuery || selectedDepartments.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Job Listings */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <h3 className="mt-2 text-lg font-medium">Loading jobs...</h3>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="col-span-full p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No job openings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
              <Button onClick={clearFilters} variant="outline" className="mt-4">
                Clear All Filters
              </Button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const hasApplied = hasAppliedToJob(job.id);
              
              return (
                <Card key={job.id} className={!job.status ? "opacity-75" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>{job.department}</CardDescription>
                      </div>
                      <Badge variant={job.status ? "default" : "secondary"}>
                        {job.status ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {job.description}
                    </p>
                    
                    <div className="flex items-center space-x-2 text-sm mb-4">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Posted {format(new Date(job.created_at), "MMM d, yyyy")}</span>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Skills Required:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(job.skills_and_requirements).slice(0, 3).map(([name, weight]) => (
                          <Badge key={name} variant="outline" className="bg-corporate-gray-100">
                            {name}
                          </Badge>
                        ))}
                        {Object.keys(job.skills_and_requirements).length > 3 && (
                          <Badge variant="outline">+{Object.keys(job.skills_and_requirements).length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => viewJobDetails(job)}
                    >
                      View Details
                    </Button>
                    
                    <Button
                      className="w-full bg-corporate-blue hover:bg-corporate-blue-light"
                      disabled={!job.status || hasApplied}
                      onClick={() => applyForJob(job.id)}
                    >
                      {hasApplied ? (
                        "Already Applied"
                      ) : !job.status ? (
                        "Position Closed"
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" /> Apply Now
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
      
      {/* Job Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedJob.title}</DialogTitle>
                <DialogDescription>{selectedJob.department}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Posted {format(new Date(selectedJob.created_at), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <Badge variant={selectedJob.status ? "default" : "secondary"}>
                    {selectedJob.status ? "Open" : "Closed"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Job Description</h4>
                  <p className="text-sm whitespace-pre-line">{selectedJob.description}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Skills & Requirements</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedJob.skills_and_requirements).map(([name, weight]) => (
                      <div key={name} className="flex justify-between items-center text-sm p-2 border rounded-md">
                        <span>{name}</span>
                        <Badge>{typeof weight === 'number' ? `${weight}%` : weight}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={closeJobDetails}>
                  Close
                </Button>
                
                {/* Show different buttons based on application status */}
                {hasAppliedToJob(selectedJob.id) ? (
                  <Button
                    variant="secondary"
                    disabled
                  >
                    Already Applied
                  </Button>
                ) : (
                  <Button
                    className="bg-corporate-blue hover:bg-corporate-blue-light"
                    disabled={!selectedJob.status}
                    onClick={() => applyForJob(selectedJob.id)}
                  >
                    {!selectedJob.status ? "Position Closed" : "Apply Now"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default JobBrowse;
