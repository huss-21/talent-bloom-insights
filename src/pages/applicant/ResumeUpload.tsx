import React, { useState, useEffect } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useApplicants } from "@/hooks/useApplicants";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/layout/MainLayout";
import { Upload, CheckCircle, X, AlertTriangle, FileText, User, IdCard } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const applicationFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  nationalId: z.string().min(3, "National ID is required"),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

const ResumeUpload = () => {
  const { jobs, loading: jobsLoading } = useJobs();
  const { addApplication, getApplicantsByUserId } = useApplicants();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get the jobId from query parameter
  const queryParams = new URLSearchParams(location.search);
  const jobIdFromQuery = queryParams.get('jobId');
  
  // Initialize form with default values
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      fullName: currentUser?.name || "",
      nationalId: "",
    },
    mode: "onChange" // Enable validation on change for better UX
  });
  
  // Effect to load the selected job
  useEffect(() => {
    if (!jobIdFromQuery || !jobs) return;
    
    const job = jobs.find(job => job.id === jobIdFromQuery);
    if (job) {
      setSelectedJob(job);
    } else {
      // If job not found, redirect back to jobs page
      toast({
        title: "Job not found",
        description: "The job you're trying to apply for doesn't exist or has been removed.",
        variant: "destructive",
      });
      navigate('/applicant/jobs');
    }
  }, [jobIdFromQuery, jobs, navigate]);
  
  // Check if user has already applied to this job
  useEffect(() => {
    if (!currentUser || !jobIdFromQuery) return;
    
    const userApplications = getApplicantsByUserId(currentUser.id);
    const hasAlreadyApplied = userApplications.some(app => app.jobId === jobIdFromQuery);
    
    if (hasAlreadyApplied) {
      toast({
        title: "Already Applied",
        description: "You have already applied for this position.",
        variant: "default",
      });
      navigate('/applicant/jobs');
    }
  }, [currentUser, jobIdFromQuery, getApplicantsByUserId, navigate]);
  
  // Set the name from currentUser when it's available
  useEffect(() => {
    if (currentUser?.name) {
      form.setValue("fullName", currentUser.name);
    }
  }, [currentUser, form]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrorMessage("Only PDF files are allowed");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size exceeds 5MB limit");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    
    setSelectedFile(file);
    setErrorMessage(null);
  };
  
  const onSubmit = async (values: ApplicationFormValues) => {
    if (!selectedJob) {
      toast({
        title: "Error",
        description: "No job selected. Please go back and select a job to apply for.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please upload your resume",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to apply",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Generate a unique file path for the resume
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;
      
      console.log("Uploading resume to:", filePath);
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('resumes')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf'
        });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
      
      console.log("Upload successful:", uploadData);
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase
        .storage
        .from('resumes')
        .getPublicUrl(filePath);
      
      const resumeUrl = publicUrlData.publicUrl;
      console.log("Resume URL:", resumeUrl);
      
      // Get the job description
      const jobDescription = selectedJob ? selectedJob.description : '';
      
      // Create applicant record in the database
      let userId = currentUser.id;
      
      // Log the types for debugging
      console.log("User ID type:", typeof userId, "Value:", userId);
      console.log("Job ID type:", typeof selectedJob.id, "Value:", selectedJob.id);
      
      // Generate UUIDs if the existing IDs are not in UUID format
      try {
        // Check if the current IDs are valid UUIDs by trying to parse them
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          console.log("User ID is not a valid UUID, generating a new one");
          userId = uuidv4();
          console.log("Generated UUID for user:", userId);
        }
        
        // Same for job ID
        let jobId = selectedJob.id;
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) {
          console.log("Job ID is not a valid UUID, generating a new one");
          jobId = uuidv4();
          console.log("Generated UUID for job:", jobId);
        }
      
        const newApplicant = await addApplication({
          userId: userId,
          jobId: jobId,
          fullName: values.fullName,
          email: currentUser.email,
          resumeUrl,
          nationalId: values.nationalId,
          coverLetter: '',
          resumeFileName: selectedFile.name,
          resumeFilePath: filePath,
          jobDescription: jobDescription // Include the job description
        });
        
        if (!newApplicant) {
          throw new Error("Failed to create application");
        }
        
        toast({
          title: "Application Submitted",
          description: "Your resume has been successfully uploaded and your application has been submitted.",
        });
        
        // Navigate to applications view
        navigate('/applicant/applications');
      } catch (idError: any) {
        console.error("Error with UUID conversion:", idError);
        throw new Error(`Invalid ID format: ${idError.message}`);
      }
      
    } catch (error: any) {
      console.error("Resume upload error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to process your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  if (jobsLoading || !selectedJob) {
    return (
      <MainLayout roles={["applicant"]}>
        <div className="max-w-2xl mx-auto p-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">Loading job details...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout roles={["applicant"]}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Upload Your Resume</h1>
        
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Resume Upload</CardTitle>
                <CardDescription>
                  Upload your resume to apply for this position
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Selected Job Info */}
                <div className="p-4 border rounded-md bg-muted/50">
                  <h3 className="font-medium mb-1">{selectedJob.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{selectedJob.department}</p>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Key Skills Required:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedJob.skills_and_requirements || {}).map(([name, weight]) => (
                        <Badge key={name} variant="outline" className="bg-corporate-gray-100">
                          {name}: {typeof weight === 'number' ? `${weight}%` : String(weight)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Personal Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <User className="mr-2 h-4 w-4 opacity-70 self-center" />
                            <Input placeholder="Enter your full name" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>National ID</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <IdCard className="mr-2 h-4 w-4 opacity-70 self-center" />
                            <Input placeholder="Enter your National ID" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="resume">Upload Resume (PDF only, max 5MB)</Label>
                  <div 
                    className="border-2 border-dashed rounded-md px-6 py-8 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => !selectedFile && document.getElementById('resume')?.click()}
                  >
                    
                    <div className="flex flex-col items-center">
                      {selectedFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              // Update form validation
                              form.trigger();
                            }}
                          >
                            <X className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="mb-1 text-sm font-medium">Drag and drop your resume, or click to browse</p>
                          <p className="text-xs text-muted-foreground mb-4">PDF format only, max 5MB</p>
                          
                          <input
                            id="resume"
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => {
                              handleFileChange(e);
                              // Update form validation
                              form.trigger();
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('resume')?.click();
                            }}
                          >
                            <Upload className="mr-2 h-4 w-4" /> Browse Files
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {errorMessage && (
                    <div className="flex items-center text-red-600 text-sm mt-1">
                      <AlertTriangle className="h-4 w-4 mr-1" /> {errorMessage}
                    </div>
                  )}
                </div>
                
                {/* Process Description */}
                <div className="p-4 bg-blue-50 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> What happens next?
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>1. Your resume will be uploaded and stored securely</li>
                    <li>2. Hiring managers will be notified of your application</li>
                    <li>3. You can track the status of your application in your dashboard</li>
                  </ul>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/applicant/jobs')}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-pulse mr-2">•</span> 
                      Uploading...
                    </>
                  ) : (
                    <>Submit Application</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ResumeUpload;
