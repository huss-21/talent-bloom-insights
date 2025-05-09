
import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { LLMConfig as LLMSettings } from "@/services/resumeAnalysis";
import { AlertCircle, Check } from "lucide-react";

const LLMConfig = () => {
  // State for API Keys
  const [openAIKey, setOpenAIKey] = useState(LLMSettings.openAI.apiKey);
  const [bedrockKey, setBedrockKey] = useState(LLMSettings.bedrock.apiKey);
  
  // State for prompts
  const [systemPrompt, setSystemPrompt] = useState(LLMSettings.prompts.system);
  const [userPrompt, setUserPrompt] = useState(LLMSettings.prompts.user);
  
  // Update keys
  const handleSaveOpenAIKey = () => {
    LLMSettings.openAI.setApiKey(openAIKey);
    toast({
      title: "OpenAI API Key Updated",
      description: "Your API key has been saved",
    });
  };
  
  const handleSaveBedrockKey = () => {
    LLMSettings.bedrock.setApiKey(bedrockKey);
    toast({
      title: "AWS Bedrock API Key Updated",
      description: "Your API key has been saved",
    });
  };
  
  // Update prompts
  const handleSavePrompts = () => {
    LLMSettings.prompts.updatePrompts(systemPrompt, userPrompt);
    toast({
      title: "Prompts Updated",
      description: "Your LLM prompts have been saved",
    });
  };

  return (
    <MainLayout roles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LLM Configuration</h1>
          <p className="text-muted-foreground">
            Configure API keys and prompts for resume analysis
          </p>
        </div>
        
        <Tabs defaultValue="api-keys">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>OpenAI API Key</CardTitle>
                <CardDescription>
                  Configure your OpenAI API key for resume analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      value={openAIKey}
                      onChange={(e) => setOpenAIKey(e.target.value)}
                      placeholder="sk-..."
                    />
                  </div>
                  
                  {openAIKey && (
                    <div className="flex items-center text-sm text-corporate-teal">
                      <Check className="h-4 w-4 mr-1" />
                      API key is set
                    </div>
                  )}
                  
                  {!openAIKey && (
                    <div className="flex items-center text-sm text-amber-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      No API key is configured
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveOpenAIKey}>Save API Key</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AWS Bedrock API Key</CardTitle>
                <CardDescription>
                  Configure your AWS Bedrock API key for resume analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrock-key">API Key</Label>
                    <Input
                      id="bedrock-key"
                      type="password"
                      value={bedrockKey}
                      onChange={(e) => setBedrockKey(e.target.value)}
                      placeholder="Enter your AWS Bedrock API key"
                    />
                  </div>
                  
                  {bedrockKey && (
                    <div className="flex items-center text-sm text-corporate-teal">
                      <Check className="h-4 w-4 mr-1" />
                      API key is set
                    </div>
                  )}
                  
                  {!bedrockKey && (
                    <div className="flex items-center text-sm text-amber-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      No API key is configured
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveBedrockKey}>Save API Key</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="prompts" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>LLM Prompts</CardTitle>
                <CardDescription>
                  Configure the prompts used for resume analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">System Prompt</Label>
                    <Textarea
                      id="system-prompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Enter system prompt"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      This sets the behavior and role of the AI assistant
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user-prompt">User Prompt Template</Label>
                    <Textarea
                      id="user-prompt"
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Enter user prompt template"
                      rows={10}
                    />
                    <p className="text-sm text-muted-foreground">
                      The template can use placeholders like {"{{"}}jobCriteria{{"}}"}}} and {"{{"}}resumeText{{"}}"}}} which will be replaced with actual values
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSavePrompts}>Save Prompts</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Variables Reference</CardTitle>
                <CardDescription>
                  Available variables for prompt templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-mono bg-muted p-2 rounded">{"{{"}}jobCriteria{{"}}"}}</div>
                    <div>The criteria object from the job posting</div>
                    
                    <div className="font-mono bg-muted p-2 rounded">{"{{"}}resumeText{{"}}"}}</div>
                    <div>The extracted text from the resume PDF</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default LLMConfig;
