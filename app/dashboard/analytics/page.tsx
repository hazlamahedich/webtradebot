"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, X, FileCode, GitPullRequest } from "lucide-react";

// Sample data for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() });
  const [repository, setRepository] = useState("all");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    reviewTrend: [],
    issuesByType: [],
    issuesBySeverity: [],
    timeToResolve: [],
    repositoryMetrics: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // This would be replaced with actual API call
        // const response = await fetch('/api/analytics?repository=${repository}&from=${dateRange.from}&to=${dateRange.to}');
        // const data = await response.json();
        
        // Simulated data for demonstration
        const data = {
          reviewTrend: [
            { date: "2023-01", reviews: 12, approved: 8, changesRequested: 4 },
            { date: "2023-02", reviews: 15, approved: 10, changesRequested: 5 },
            { date: "2023-03", reviews: 22, approved: 16, changesRequested: 6 },
            { date: "2023-04", reviews: 28, approved: 20, changesRequested: 8 },
            { date: "2023-05", reviews: 32, approved: 25, changesRequested: 7 },
          ],
          issuesByType: [
            { name: "Security", value: 15 },
            { name: "Performance", value: 22 },
            { name: "Code Quality", value: 38 },
            { name: "Bugs", value: 27 },
            { name: "Tests", value: 18 },
          ],
          issuesBySeverity: [
            { name: "Critical", value: 5 },
            { name: "High", value: 15 },
            { name: "Medium", value: 45 },
            { name: "Low", value: 35 },
          ],
          timeToResolve: [
            { severity: "Critical", time: 2.3 },
            { severity: "High", time: 4.7 },
            { severity: "Medium", time: 7.2 },
            { severity: "Low", time: 11.6 },
          ],
          repositoryMetrics: [
            { name: "frontend", quality: 86, issues: 24, improvements: 37 },
            { name: "backend", quality: 92, issues: 18, improvements: 29 },
            { name: "api", quality: 88, issues: 22, improvements: 33 },
            { name: "database", quality: 94, issues: 12, improvements: 21 },
          ]
        };

        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [dateRange, repository]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Select value={repository} onValueChange={setRepository}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Repositories</SelectItem>
              <SelectItem value="frontend">Frontend</SelectItem>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="database">Database</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
          />
          <Button variant="outline">Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <p className="text-xs text-muted-foreground">+2.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">183</div>
            <p className="text-xs text-muted-foreground">-8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8 days</div>
            <p className="text-xs text-muted-foreground">-1.2 days from last month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Team Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="issues">Issue Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Repository Quality Metrics</CardTitle>
              <CardDescription>Code quality scores and issue distribution across repositories</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.repositoryMetrics}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quality" name="Quality Score" fill="#0088FE" />
                  <Bar dataKey="issues" name="Issues Found" fill="#FF8042" />
                  <Bar dataKey="improvements" name="Improvements Suggested" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Review Trends</CardTitle>
              <CardDescription>Monthly review volume and outcomes</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analyticsData.reviewTrend}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reviews" 
                    name="Total Reviews" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    name="Approved"
                    stroke="#82ca9d" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="changesRequested" 
                    name="Changes Requested"
                    stroke="#ffc658"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="issues" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Issues by Type</CardTitle>
                <CardDescription>Distribution of detected issues by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.issuesByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.issuesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Issues by Severity</CardTitle>
                <CardDescription>Distribution of detected issues by severity level</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.issuesBySeverity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.issuesBySeverity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Time to Resolve by Severity</CardTitle>
                <CardDescription>Average days to resolve issues by severity level</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.timeToResolve}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="severity" />
                    <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="time" name="Average Days to Resolve" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard; 