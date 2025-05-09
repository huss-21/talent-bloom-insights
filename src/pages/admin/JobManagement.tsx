
import React, { useState } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useApplicants } from "@/hooks/useApplicants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Briefcase, Plus, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import JobForm, { JobFormData } from "@/components/JobForm";
import { Skeleton } from "@/components/ui/skeleton";

interface CriterionInput {
  name: string;
  weight: number;
}

const JobManagement = () => {
  const { jobs, loading, addJob, updateJobStatus, refreshJobs } = useJobs();
  const { getApplicantsByJobId } = useApplicants();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleFormSubmit = async (data: JobFormData, criteria: CriterionInput[]) => {
    // Validate criteria
    const validCriteria = criteria.filter(c => c.name.trim() !== "" && c.weight > 0);
    if (validCriteria.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one criterion with a weight",
        variant: "destructive",
      });
      return;
    }
    
    // Convert criteria to the expected format for skills_and_requirements
    const skillsAndRequirements: Record<string, number> = {};
    validCriteria.forEach(c => {
      skillsAndRequirements[c.name] = c.weight;
    });
    
    try {
      console.log("Submitting job to Supabase:", {
        title: data.title,
        description: data.description,
        department: data.department,
        skills_and_requirements: skillsAndRequirements,
        status: data.status
      });
      
      const result = await addJob({
        title: data.title,
        description: data.description,
        department: data.department,
        skills_and_requirements: skillsAndRequirements,
        status: data.status
      });
      
      if (result) {
        toast({
          title: "Job Opening Created",
          description: "The job opening has been successfully created."
        });
        
        // Refresh the jobs list to ensure we're displaying the latest data
        refreshJobs();
        setIsOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create the job opening. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleStatusChange = async (jobId: string, status: boolean) => {
    try {
      await updateJobStatus(jobId, status);
      toast({
        title: "Status Updated",
        description: `Job has been marked as ${status ? "open" : "closed"}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job status.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <MainLayout roles={["admin"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Job Management</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-corporate-blue hover:bg-corporate-blue-light">
                <Plus className="mr-2 h-4 w-4" /> Add New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job Opening</DialogTitle>
                <DialogDescription>
                  Fill out the details below to create a new job opening.
                </DialogDescription>
              </DialogHeader>
              <JobForm 
                onSubmit={handleFormSubmit} 
                onCancel={() => setIsOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <h3 className="mt-2 text-lg font-medium">Loading job openings...</h3>
            </div>
          ) : jobs.length === 0 ? (
            <div className="col-span-full p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No job openings found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first job opening by clicking the "Add New Job" button.
              </p>
            </div>
          ) : (
            jobs.map((job) => {
              const applicants = getApplicantsByJobId(job.id);
              return (
                <Card key={job.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <Badge variant={job.status ? "default" : "secondary"}>
                        {job.status ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <CardDescription>{job.department}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{applicants.length} applicant{applicants.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{Object.keys(job.skills_and_requirements).length} skill criteria</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Posted on {format(new Date(job.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Key Skills & Requirements:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(job.skills_and_requirements).map(([name, weight]) => (
                          <Badge key={name} variant="outline" className="bg-corporate-gray-100">
                            {name}: {typeof weight === 'number' ? `${weight}%` : weight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => handleStatusChange(job.id, !job.status)}
                    >
                      {job.status ? "Mark as Closed" : "Reopen Position"}
                    </Button>
                    <Link to={`/admin/jobs/${job.id}/applicants`}>
                      <Button variant="outline">
                        View Applications ({applicants.length})
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default JobManagement;
