
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";

type FormData = {
  email: string;
  password: string;
};

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // For demo, navigate based on hard-coded emails
      if (data.email === "admin@example.com") {
        navigate("/admin/dashboard");
      } else {
        navigate("/applicant/dashboard");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout requireAuth={false}>
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="w-full flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-corporate-blue flex items-center justify-center text-white font-bold text-2xl">
                HR
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Welcome to Talent Bloom</CardTitle>
            <CardDescription className="text-center">
              Login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="youremail@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-corporate-teal hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  {...register("password", { required: "Password is required" })}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-corporate-blue hover:bg-corporate-blue-light" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-corporate-teal hover:underline">
                Sign up
              </Link>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm text-center text-gray-500">Demo Credentials</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="p-2 border rounded-md">
                  <p className="font-medium">Admin:</p>
                  <p>admin@example.com</p>
                  <p>password</p>
                </div>
                <div className="p-2 border rounded-md">
                  <p className="font-medium">Applicant:</p>
                  <p>applicant@example.com</p>
                  <p>password</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Login;
