"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import { LineChart, BarChart, PieChart, Pie, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, Bar } from "recharts";

interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
}

interface ModelUsage {
  model: string;
  provider: string;
  totalTokens: number;
  totalCost: number;
  requests: number;
}

interface FeatureUsage {
  feature: string;
  totalTokens: number;
  totalCost: number;
  requests: number;
}

interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
  requests: number;
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", 
  "#82CA9D", "#FFC658", "#8DD1E1", "#A4DE6C", "#D0ED57"
];

const TIME_PERIODS = [
  { value: "day", label: "Last 24 Hours" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
];

export function LLMUsage() {
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState("day");
  const [summary, setSummary] = useState<UsageSummary>({
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0
  });
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Fetch usage data
  useEffect(() => {
    loadUsageData(period);
  }, [period]);
  
  async function loadUsageData(timePeriod: string) {
    try {
      setIsLoading(true);
      
      // Fetch model usage
      const modelResponse = await fetch(`/api/llm/usage/models?period=${timePeriod}`);
      if (!modelResponse.ok) {
        throw new Error('Failed to fetch model usage data');
      }
      const modelData = await modelResponse.json();
      setModelUsage(modelData);
      
      // Fetch feature usage
      const featureResponse = await fetch(`/api/llm/usage/features?period=${timePeriod}`);
      if (!featureResponse.ok) {
        throw new Error('Failed to fetch feature usage data');
      }
      const featureData = await featureResponse.json();
      setFeatureUsage(featureData);
      
      // Fetch daily usage (for charts)
      const dailyResponse = await fetch(`/api/llm/usage/daily?period=${timePeriod}`);
      if (!dailyResponse.ok) {
        throw new Error('Failed to fetch daily usage data');
      }
      const dailyData = await dailyResponse.json();
      setDailyUsage(dailyData);
      
      // Calculate summary
      const totalRequests = modelData.reduce((sum: number, item: ModelUsage) => sum + item.requests, 0);
      const totalTokens = modelData.reduce((sum: number, item: ModelUsage) => sum + item.totalTokens, 0);
      const totalCost = modelData.reduce((sum: number, item: ModelUsage) => sum + item.totalCost, 0);
      
      setSummary({
        totalRequests,
        totalTokens,
        totalCost
      });
      
    } catch (error) {
      console.error('Error loading usage data:', error);
      setAlertMessage({
        type: 'error',
        message: 'Failed to load usage data'
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Format cost as USD currency
  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    }).format(cost);
  };

  // Format tokens with commas
  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString();
  };
  
  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{data.model || data.feature}</p>
          <p>Tokens: {formatTokens(data.totalTokens)}</p>
          <p>Cost: {formatCost(data.totalCost)}</p>
          <p>Requests: {data.requests}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">LLM Usage & Cost</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and analyze your language model usage
          </p>
        </div>
        <Select
          value={period}
          onValueChange={setPeriod}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Time Period" />
          </SelectTrigger>
          <SelectContent>
            {TIME_PERIODS.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {alertMessage && (
        <Alert className={`mb-4 ${alertMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertTitle>{alertMessage.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total LLM API calls within the selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTokens(summary.totalTokens)}</div>
            <p className="text-xs text-muted-foreground">
              Combined input and output tokens
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(summary.totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated cost based on provider pricing
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts & Detailed Stats */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="h-96">
              <CardHeader>
                <CardTitle>Usage by Model</CardTitle>
                <CardDescription>
                  Token usage distribution across different models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={modelUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalTokens"
                      nameKey="model"
                    >
                      {modelUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="h-96">
              <CardHeader>
                <CardTitle>Usage by Feature</CardTitle>
                <CardDescription>
                  Token usage across different application features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={featureUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalTokens"
                      nameKey="feature"
                    >
                      {featureUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="models" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Model</CardTitle>
              <CardDescription>
                Detailed breakdown of usage and cost by model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelUsage.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No usage data available for the selected period</p>
                ) : (
                  <div className="grid gap-4">
                    {modelUsage.map((model, index) => (
                      <Card key={index} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{model.model}</h3>
                              <p className="text-sm text-muted-foreground">{model.provider}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCost(model.totalCost)}</p>
                              <p className="text-sm">{model.requests} requests</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">Tokens: {formatTokens(model.totalTokens)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="features" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Feature</CardTitle>
              <CardDescription>
                Detailed breakdown of usage and cost by application feature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureUsage.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No feature usage data available for the selected period</p>
                ) : (
                  <div className="grid gap-4">
                    {featureUsage.map((feature, index) => (
                      <Card key={index} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium capitalize">{feature.feature}</h3>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCost(feature.totalCost)}</p>
                              <p className="text-sm">{feature.requests} requests</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">Tokens: {formatTokens(feature.totalTokens)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>
                Token usage and cost trends over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={dailyUsage}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalTokens"
                    name="Tokens"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalCost"
                    name="Cost ($)"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Request Volume</CardTitle>
              <CardDescription>
                Number of LLM API requests over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={dailyUsage}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requests" name="Requests" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 