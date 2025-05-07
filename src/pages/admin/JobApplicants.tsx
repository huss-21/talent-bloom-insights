
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
import { format } from "date-fns";
import { ArrowLeft, Download, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";

const JobApplicants = () => {
  const { jobId } = useParams();
  const { getJobById } = useJobOpenings();
  const { applicants, ratings, getApplicantsByJobId, getRatingByApplicantId } = useApplicants();
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  
  const job = jobId ? getJobById(jobId) : null;
  const jobApplicants = jobId ? getApplicantsByJobId(jobId) : [];
  
  const selectedApplicant = selectedApplicantId 
    ? applicants.find(app => app.id === selectedApplicantId) 
    : null;
  
  const selectedRating = selectedApplicant
    ? getRatingByApplicantId(selectedApplicant.id)
    : null;
  
  // Select first applicant by default if available
  useEffect(() => {
    if (jobApplicants.length > 0 && !selectedApplicantId) {
      setSelectedApplicantId(jobApplicants[0].id);
    }
  }, [jobApplicants, selectedApplicantId]);

  if (!job) {
    return (
      <MainLayout roles={["admin"]}>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Link to="/admin/jobs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p>Job opening not found.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout roles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Link to="/admin/jobs">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-4">{job.title}</h1>
            <p className="text-muted-foreground">
              {job.department} • {jobApplicants.length} Applicant{jobApplicants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Badge variant={job.status === "open" ? "default" : "secondary"} className="text-sm">
            {job.status.toUpperCase()}
          </Badge>
        </div>
        
        {jobApplicants.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p>No applicants have applied for this position yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Applicants</CardTitle>
                <CardDescription>
                  {jobApplicants.length} applicant{jobApplicants.length !== 1 ? "s" : ""} for this position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobApplicants.map(applicant => {
                    const applicantRating = getRatingByApplicantId(applicant.id);
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
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
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
                  <div>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="resume">Resume & Analysis</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 rounded-full bg-corporate-blue flex items-center justify-center text-white">
                            <User className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">Applicant #{selectedApplicant.id}</h3>
                            <p className="text-sm text-muted-foreground">
                              Applied on {format(new Date(selectedApplicant.applicationDate), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {selectedRating ? (
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-medium mb-4">Match Summary</h4>
                              <div className="flex items-center space-x-4">
                                <div className={`text-4xl font-bold ${
                                  selectedRating.overallMatchPercentage >= 80 ? 'text-green-600' : 
                                  selectedRating.overallMatchPercentage >= 60 ? 'text-amber-600' : 
                                  'text-red-600'
                                }`}>
                                  {selectedRating.overallMatchPercentage}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Overall match score based on job criteria
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-4">Skills Analysis</h4>
                              <div className="space-y-4">
                                {Object.entries(selectedRating.criteriaScores).map(([criterion, score]) => (
                                  <div key={criterion}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span>{criterion}</span>
                                      <span className={`font-medium ${
                                        score >= 80 ? 'text-green-600' : 
                                        score >= 60 ? 'text-amber-600' : 
                                        'text-red-600'
                                      }`}>
                                        {score}%
                                      </span>
                                    </div>
                                    <Progress value={score} className="h-2" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-4">Key Matching Phrases</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {selectedRating.keyPhrases.map((phrase, index) => (
                                  <li key={index} className="text-sm">{phrase}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No rating data available for this applicant.</p>
                        )}
                      </TabsContent>
                      <TabsContent value="resume" className="space-y-6 mt-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-medium">Resume</h4>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Download Resume
                          </Button>
                        </div>
                        
                        <div className="border rounded-md p-8 flex flex-col items-center justify-center bg-gray-50 min-h-[300px]">
                          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Resume preview not available. Click the download button to view the resume.
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-4">Analysis Process</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            This resume was analyzed using an LLM to extract relevant skills and match them against the job criteria.
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Criteria</TableHead>
                                <TableHead>Job Requirement</TableHead>
                                <TableHead>Applicant Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedRating && Object.entries(selectedRating.criteriaScores).map(([criterion, score]) => {
                                const jobCriteriaWeight = job.criteria[criterion] || 0;
                                
                                return (
                                  <TableRow key={criterion}>
                                    <TableCell className="font-medium">{criterion}</TableCell>
                                    <TableCell>{jobCriteriaWeight}%</TableCell>
                                    <TableCell className={`font-medium ${
                                      score >= 80 ? 'text-green-600' : 
                                      score >= 60 ? 'text-amber-600' : 
                                      'text-red-600'
                                    }`}>
                                      {score}%
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>LLM Integration Guide</CardTitle>
            <CardDescription>How to connect to an LLM API for resume analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Step 1: Choose an LLM Provider</h3>
              <p className="text-sm text-muted-foreground">
                You can integrate with OpenAI's API (GPT-4/GPT-3.5) or AWS Bedrock (Claude, LLaMa, etc.)
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Step 2: Setup API Integration</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-x-auto">
{`// Example OpenAI API integration
async function analyzeResume(resumeText, jobCriteria) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a resume analyzer that evaluates candidates based on job criteria."
        },
        {
          role: "user",
          content: \`
            Analyze this resume against the following criteria. 
            Provide scores between 0-100 for each criterion and an overall match percentage.
            Also include 3-5 key phrases from the resume that match the job requirements.
            
            Job Criteria: \${JSON.stringify(jobCriteria)}
            
            Resume Text:
            \${resumeText}
            
            Respond with a JSON object with this structure:
            {
              "criteriaScores": { "criterion1": score1, "criterion2": score2... },
              "overallMatchPercentage": number,
              "keyPhrases": ["phrase1", "phrase2", "phrase3"]
            }
          \`
        }
      ]
    })
  });
  
  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}`}
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Step 3: Implement in the Application</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The best place to implement this functionality would be in a new file:
              </p>
              <code className="text-sm bg-gray-50 p-2 rounded">/src/services/resumeAnalysis.ts</code>
              <p className="text-sm text-muted-foreground mt-2">
                This service would handle PDF text extraction and LLM analysis, then update the applicant's rating in the database.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Step 4: Extract Text from PDFs</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-x-auto">
{`// Example PDF text extraction
import * as pdfjs from 'pdfjs-dist';

async function extractTextFromPDF(pdfFile) {
  // Set up PDF.js worker
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  
  // Load the PDF
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  // Extract text from each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + ' ';
  }
  
  return fullText;
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default JobApplicants;
