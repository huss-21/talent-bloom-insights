import React, { useState } from "react";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { JobOpening } from "@/types";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Briefcase, Plus, Users, Calendar, X } from "lucide-react";
import { Link } from "react-router-dom";

interface CriterionInput {
  name: string;
  weight: number;
}

interface JobFormData {
  title: string;
  description: string;
  department: string;
  status: "open" | "closed";
}

const JobManagement = () => {
  const { jobOpenings, loading, addJob, updateJobStatus } = useJobOpenings();
  const { getApplicantsByJobId } = useApplicants();
  const [isOpen, setIsOpen] = useState(false);
  const [criteria, setCriteria] = useState<CriterionInput[]>([
    { name: "", weight: 0 }
  ]);
  
  const form = useForm<JobFormData>({
    defaultValues: {
      title: "",
      description: "",
      department: "",
      status: "open"
    }
  });
  
  const onSubmit = async (data: JobFormData) => {
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
    
    // Convert criteria to the expected format
    const criteriaObject: Record<string, number> = {};
    validCriteria.forEach(c => {
      criteriaObject[c.name] = c.weight;
    });
    
    try {
      await addJob({
        title: data.title,
        description: data.description,
        department: data.department,
        criteria: criteriaObject,
        status: data.status
      });
      
      toast({
        title: "Job Opening Created",
        description: "The job opening has been successfully created."
      });
      
      setIsOpen(false);
      form.reset();
      setCriteria([{ name: "", weight: 0 }]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create the job opening. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const addCriterion = () => {
    setCriteria([...criteria, { name: "", weight: 0 }]);
  };
  
  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };
  
  const updateCriterionName = (index: number, name: string) => {
    const newCriteria = [...criteria];
    newCriteria[index].name = name;
    setCriteria(newCriteria);
  };
  
  const updateCriterionWeight = (index: number, weight: number) => {
    const newCriteria = [...criteria];
    newCriteria[index].weight = weight;
    setCriteria(newCriteria);
  };
  
  const handleStatusChange = async (jobId: string, status: "open" | "closed") => {
    try {
      await updateJobStatus(jobId, status);
      toast({
        title: "Status Updated",
        description: `Job has been marked as ${status}.`
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    rules={{ required: "Job title is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="department"
                    rules={{ required: "Department is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Engineering" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    rules={{ required: "Description is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the job requirements and responsibilities..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Skills & Requirements</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCriterion}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Criterion
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            placeholder="Criterion name (e.g., React)"
                            value={criterion.name}
                            onChange={(e) => updateCriterionName(index, e.target.value)}
                            className="flex-grow"
                          />
                          <div className="flex items-center space-x-2 w-[120px]">
                            <Input
                              type="number"
                              placeholder="Weight %"
                              min="0"
                              max="100"
                              value={criterion.weight || ""}
                              onChange={(e) => updateCriterionWeight(index, parseInt(e.target.value, 10) || 0)}
                            />
                            <span>%</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCriterion(index)}
                            disabled={criteria.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-corporate-blue hover:bg-corporate-blue-light">
                      Create Job
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p>Loading job openings...</p>
          ) : jobOpenings.length === 0 ? (
            <p>No job openings found. Create your first job opening.</p>
          ) : (
            jobOpenings.map((job) => {
              const applicants = getApplicantsByJobId(job.id);
              return (
                <Card key={job.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <Badge variant={job.status === "open" ? "default" : "secondary"}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
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
                        <span>{Object.keys(job.criteria).length} skill criteria</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Posted on {format(new Date(job.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Key Skills & Requirements:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(job.criteria).map(([name, weight]) => (
                          <Badge key={name} variant="outline" className="bg-corporate-gray-100">
                            {name}: {weight}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={() => handleStatusChange(job.id, job.status === "open" ? "closed" : "open")}>
                      {job.status === "open" ? "Mark as Closed" : "Reopen Position"}
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
