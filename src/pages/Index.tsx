
import React from "react";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { currentUser } = useAuth();

  // If user is already logged in, redirect to their dashboard
  if (currentUser) {
    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/applicant/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-corporate-blue to-corporate-blue-light text-white">
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <div className="mb-8 flex items-center justify-center">
            <div className="h-20 w-20 rounded-xl bg-corporate-gold flex items-center justify-center text-white font-bold text-3xl mr-4">
              HR
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Talent Bloom Insights</h1>
          </div>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl">
            Advanced HRMS with AI-powered resume analysis for perfect candidate matching
          </p>
          
          <div className="flex gap-4 flex-col sm:flex-row">
            <Button 
              asChild 
              className="bg-corporate-teal hover:bg-corporate-teal-light text-white px-8 py-6 text-lg"
            >
              <a href="/login">Sign In</a>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-corporate-blue px-8 py-6 text-lg"
            >
              <a href="/register">Create Account</a>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-corporate-blue flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Resume Analysis</h3>
              <p className="text-gray-600">
                Automatically analyze resumes against job criteria for accurate matching and scoring based on skills and experience.
              </p>
            </div>
            
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-corporate-teal flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Dynamic Job Management</h3>
              <p className="text-gray-600">
                Create and manage job openings with custom criteria and skills requirements tailored to each position.
              </p>
            </div>
            
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-corporate-gold flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Analytics</h3>
              <p className="text-gray-600">
                Comprehensive visual dashboards with charts and metrics to track hiring progress and candidate comparisons.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-corporate-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Hiring Process?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join Talent Bloom Insights to streamline your recruitment with AI-powered matching and comprehensive analytics.
          </p>
          
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Button 
              asChild 
              className="bg-corporate-blue hover:bg-corporate-blue-light text-white px-8"
            >
              <a href="/register">Get Started</a>
            </Button>
            <Button 
              asChild 
              variant="outline"
              className="border-corporate-blue text-corporate-blue hover:bg-corporate-blue hover:text-white px-8"
            >
              <a href="/login">Log In</a>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-corporate-blue text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-10 w-10 rounded-md bg-corporate-gold flex items-center justify-center text-white font-bold text-lg mr-2">
                HR
              </div>
              <h3 className="text-xl font-bold">Talent Bloom Insights</h3>
            </div>
            
            <div className="text-sm">
              © {new Date().getFullYear()} Talent Bloom Insights. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
