
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CirclePercent } from "lucide-react";

interface ApplicantRatingChartsProps {
  skills: number | null;
  education: number | null;
  relevance: number | null;
  overall: number | null;
}

const COLORS = {
  skills: ['#9b87f5', '#AAAAAA'],
  education: ['#00C49F', '#AAAAAA'],
  relevance: ['#FFBB28', '#AAAAAA'],
  overall: ['#FF8042', '#AAAAAA']
};

export const ApplicantRatingCharts: React.FC<ApplicantRatingChartsProps> = ({ 
  skills, 
  education, 
  relevance, 
  overall 
}) => {
  const createPieData = (score: number | null) => [
    { name: 'Match', value: score || 0 },
    { name: 'Gap', value: 100 - (score || 0) },
  ];

  const skillsData = createPieData(skills);
  const educationData = createPieData(education);
  const relevanceData = createPieData(relevance);
  const overallData = createPieData(overall);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {renderChart(skillsData, COLORS.skills, 'Skills')}
      {renderChart(educationData, COLORS.education, 'Education')}
      {renderChart(relevanceData, COLORS.relevance, 'Relevance')}
      {renderChart(overallData, COLORS.overall, 'Overall')}
    </div>
  );
};
