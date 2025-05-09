
import React, { useState, useEffect } from "react";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/MainLayout";
import { Upload, CheckCircle, X, AlertTriangle, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { extractTextFromPDF, analyzeResumeWithOpenAI, createRatingFromAnalysis } from "@/services/resumeAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

const ResumeUpload = () => {
  const { jobOpenings } = useJobOpenings();
  const { addApplication, addRating } = useApplicants();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get the jobId from query parameter if available
  const queryParams = new URLSearchParams(location.search);
  const jobIdFromQuery = queryParams.get('jobId');
  
  useEffect(() => {
    if (jobIdFromQuery) {
      const job = jobOpenings.find(job => job.id === jobIdFromQuery);
      if (job) {
        setSelectedJobId(job.id);
      }
    }
  }, [jobIdFromQuery, jobOpenings]);
  
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
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedJobId || !selectedFile || !currentUser) {
      toast({
        title: "Validation Error",
        description: "Please select a job and upload a PDF resume",
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
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('resumes')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });
      
      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase
        .storage
        .from('resumes')
        .getPublicUrl(filePath);
      
      const resumeUrl = publicUrlData.publicUrl;
      
      // Create applicant record in the database
      const newApplicant = await addApplication({
        userId: currentUser.id,
        jobId: selectedJobId,
        fullName: currentUser.name || 'Unnamed User',
        email: currentUser.email,
        resumeUrl,
        coverLetter: '',
        resumeFileName: selectedFile.name,
        resumeFilePath: filePath
      });
      
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been successfully uploaded",
      });
      
      // Start analysis process
      setIsUploading(false);
      setIsAnalyzing(true);
      
      // Get job criteria for analysis
      const selectedJob = jobOpenings.find(job => job.id === selectedJobId);
      if (!selectedJob) throw new Error("Job not found");
      
      // Extract text from PDF (would be real in production)
      const resumeText = await extractTextFromPDF(selectedFile);
      
      // Send to LLM API for analysis
      const analysisResult = await analyzeResumeWithOpenAI(resumeText, selectedJob.criteria);
      
      // Create rating from analysis and store in database
      const ratingData = createRatingFromAnalysis(newApplicant.id, analysisResult);
      
      // Save rating to database
      await addRating(ratingData);
      
      toast({
        title: "Analysis Complete",
        description: `Your resume scored ${analysisResult.overallMatchPercentage}% match for this position`,
      });
      
      // Navigate to applications view
      navigate('/applicant/applications');
      
    } catch (error) {
      console.error("Resume upload error:", error);
      toast({
        title: "Error",
        description: "Failed to process your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };
  
  const selectedJob = selectedJobId 
    ? jobOpenings.find(job => job.id === selectedJobId) 
    : null;
  
  return (
    <MainLayout roles={["applicant"]}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Upload Your Resume</h1>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Resume Upload</CardTitle>
              <CardDescription>
                Upload your resume to apply for a position
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Job Selection */}
              <div className="space-y-2">
                <Label htmlFor="job">Select Position</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger id="job">
                    <SelectValue placeholder="Select a job opening" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobOpenings
                      .filter(job => job.status === "open")
                      .map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} - {job.department}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Selected Job Info */}
              {selectedJob && (
                <div className="p-4 border rounded-md bg-muted/50">
                  <h3 className="font-medium mb-1">{selectedJob.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{selectedJob.department}</p>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Key Skills Required:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedJob.criteria).map(([name, weight]) => (
                        <Badge key={name} variant="outline" className="bg-corporate-gray-100">
                          {name}: {weight}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="resume">Upload Resume (PDF only, max 5MB)</Label>
                <div className="border-2 border-dashed rounded-md px-6 py-8">
                  <div className="flex flex-col items-center">
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="h-8 w-8 text-corporate-teal mb-2" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setSelectedFile(null)}
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
                          onChange={handleFileChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('resume')?.click()}
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
              <div className="p-4 bg-corporate-blue/10 rounded-md">
                <h4 className="font-medium mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-corporate-teal" /> What happens next?
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>1. Your resume will be uploaded and stored securely</li>
                  <li>2. Our AI will analyze your resume against job requirements</li>
                  <li>3. You'll receive a match score and detailed breakdown</li>
                  <li>4. Hiring managers will be notified of your application</li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/applicant/jobs')}
                disabled={isUploading || isAnalyzing}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                className="bg-corporate-blue hover:bg-corporate-blue-light"
                disabled={!selectedJobId || !selectedFile || isUploading || isAnalyzing}
              >
                {isUploading ? (
                  <>Uploading...</>
                ) : isAnalyzing ? (
                  <>Analyzing Resume...</>
                ) : (
                  <>Submit Application</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ResumeUpload;
