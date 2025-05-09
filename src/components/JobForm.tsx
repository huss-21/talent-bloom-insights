
import React, { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { X, Plus } from "lucide-react";

interface CriterionInput {
  name: string;
  weight: number;
}

export interface JobFormData {
  title: string;
  description: string;
  department: string;
  status: boolean;
}

interface JobFormProps {
  onSubmit: (data: JobFormData, criteria: CriterionInput[]) => Promise<void>;
  onCancel: () => void;
}

const JobForm: React.FC<JobFormProps> = ({ onSubmit, onCancel }) => {
  const [criteria, setCriteria] = useState<CriterionInput[]>([
    { name: "", weight: 0 }
  ]);
  
  const form = useForm<JobFormData>({
    defaultValues: {
      title: "",
      description: "",
      department: "",
      status: true
    }
  });
  
  const handleSubmit = async (data: JobFormData) => {
    await onSubmit(data, criteria);
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
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              <Select 
                onValueChange={(value) => field.onChange(value === "open")} 
                value={field.value ? "open" : "closed"}
              >
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
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-corporate-blue hover:bg-corporate-blue-light">
            Create Job
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default JobForm;
