
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Rating } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicantRatingChartsProps {
  rating: Rating;
}

const COLORS = {
  skills: ['#0088FE', '#AAAAAA'],
  education: ['#00C49F', '#AAAAAA'],
  experience: ['#FFBB28', '#AAAAAA'],
  overall: ['#FF8042', '#AAAAAA']
};

export const ApplicantRatingCharts: React.FC<ApplicantRatingChartsProps> = ({ rating }) => {
  const createPieData = (score: number) => [
    { name: 'Match', value: score },
    { name: 'Gap', value: 100 - score },
  ];

  const skillsData = createPieData(rating.skillsMatchPercentage);
  const educationData = createPieData(rating.educationMatchPercentage);
  const experienceData = createPieData(rating.experienceMatchPercentage);
  const overallData = createPieData(rating.overallMatchPercentage);

  const renderChart = (data: any[], colors: string[], title: string) => (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={({ value, name }) => name === 'Match' ? `${value}%` : ''}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, '']}
                contentStyle={{ fontSize: '12px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={24} 
                formatter={(value) => value === 'Match' ? title : 'Gap'}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
      {renderChart(skillsData, COLORS.skills, 'Skills')}
      {renderChart(educationData, COLORS.education, 'Education')}
      {renderChart(experienceData, COLORS.experience, 'Experience')}
      {renderChart(overallData, COLORS.overall, 'Overall')}
    </div>
  );
};
