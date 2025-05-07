
import React from "react";
import { useJobOpenings } from "@/hooks/useJobOpenings";
import { useApplicants } from "@/hooks/useApplicants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MainLayout } from "@/components/layout/MainLayout";
import { Briefcase, Users, FileText, CheckCircle } from "lucide-react";

const AdminDashboard = () => {
  const { jobOpenings, loading: jobsLoading } = useJobOpenings();
  const { applicants, ratings, loading: applicantsLoading } = useApplicants();
  
  // Count metrics
  const totalJobs = jobOpenings.length;
  const openJobs = jobOpenings.filter(job => job.status === "open").length;
  const totalApplicants = applicants.length;
  const averageMatch = ratings.length 
    ? Math.round(ratings.reduce((sum, rating) => sum + rating.overallMatchPercentage, 0) / ratings.length) 
    : 0;
  
  // Prepare data for job status chart
  const jobStatusData = [
    { name: "Open", value: openJobs },
    { name: "Closed", value: totalJobs - openJobs }
  ];
  const jobStatusColors = ["#285e61", "#718096"];
  
  // Prepare data for department breakdown
  const departmentCounts = jobOpenings.reduce((acc: Record<string, number>, job) => {
    acc[job.department] = (acc[job.department] || 0) + 1;
    return acc;
  }, {});
  
  const departmentData = Object.entries(departmentCounts).map(([name, value]) => ({
    name,
    value
  }));
  
  // Prepare data for applicants per job
  const applicantsPerJob = jobOpenings.map(job => {
    const count = applicants.filter(app => app.jobId === job.id).length;
    return {
      name: job.title,
      applicants: count
    };
  }).sort((a, b) => b.applicants - a.applicants);
  
  // Prepare data for ratings distribution
  const ratingBuckets = {
    "90-100": 0,
    "80-89": 0,
    "70-79": 0,
    "60-69": 0,
    "Below 60": 0
  };
  
  ratings.forEach(rating => {
    const score = rating.overallMatchPercentage;
    if (score >= 90) ratingBuckets["90-100"]++;
    else if (score >= 80) ratingBuckets["80-89"]++;
    else if (score >= 70) ratingBuckets["70-79"]++;
    else if (score >= 60) ratingBuckets["60-69"]++;
    else ratingBuckets["Below 60"]++;
  });
  
  const ratingDistributionData = Object.entries(ratingBuckets).map(([range, count]) => ({
    range,
    count
  }));
  
  return (
    <MainLayout roles={["admin"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Job Openings
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                {openJobs} currently open
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applicants
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplicants}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round(totalApplicants / totalJobs)} per opening average
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applications Analyzed
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ratings.length}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((ratings.length / totalApplicants) * 100)}% of total applications
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Match Score
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageMatch}%</div>
              <p className="text-xs text-muted-foreground">
                Across all applications
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Job Status Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Job Status Distribution</CardTitle>
              <CardDescription>
                Current open vs. closed job openings
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-[300px] w-full max-w-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {jobStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={jobStatusColors[index % jobStatusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Department Breakdown */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Job Openings by Department</CardTitle>
              <CardDescription>
                Distribution across company departments
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-[300px] w-full max-w-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? "#1a365d" : 
                                index === 1 ? "#285e61" : 
                                index === 2 ? "#2a4365" : 
                                index === 3 ? "#d69e2e" : "#718096"} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* More Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Applicants per Job */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Applicants per Job Opening</CardTitle>
              <CardDescription>
                Number of applications received per position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={applicantsPerJob}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={90} />
                    <Tooltip />
                    <Bar dataKey="applicants" fill="#285e61" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Rating Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Match Score Distribution</CardTitle>
              <CardDescription>
                Applicant match scores by percentage range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ratingDistributionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1a365d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
