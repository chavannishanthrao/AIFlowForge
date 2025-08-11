import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Clock, Zap, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useState } from "react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState('week');
  
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/advanced"],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/analytics/metrics", timeRange],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/analytics/alerts"],
  });

  const { data: usageStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/usage-stats", timeRange],
  });

  if (analyticsLoading || metricsLoading || alertsLoading || statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  // Prepare chart data with proper type checking
  const performanceData = (usageStats as any)?.map((stat: any) => ({
    date: new Date(stat.date).toLocaleDateString(),
    executions: stat.totalExecutions,
    successRate: stat.totalExecutions > 0 ? (stat.successfulExecutions / stat.totalExecutions * 100).toFixed(1) : 0,
    cost: stat.totalCost / 100,
    latency: stat.averageLatency
  })) || [];

  const alertSeverityData = (analytics as any)?.alertsSummary ? [
    { name: 'Critical', value: (analytics as any).alertsSummary.critical, color: '#EF4444' },
    { name: 'High', value: (analytics as any).alertsSummary.high, color: '#F97316' },
    { name: 'Medium', value: (analytics as any).alertsSummary.medium, color: '#EAB308' },
    { name: 'Low', value: (analytics as any).alertsSummary.low, color: '#22C55E' }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">Real-time performance metrics and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency((analytics as any)?.totalCostThisMonth || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {(analytics as any)?.totalCostThisMonth && (analytics as any).totalCostThisMonth > 0 ? (
                <span className="text-red-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </span>
              ) : (
                <span className="text-gray-500">No costs yet</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration((analytics as any)?.averageExecutionTime || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingDown className="w-3 h-3 mr-1" />
                -8% faster than last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics as any)?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {(analytics as any)?.successRate && (analytics as any).successRate > 90 ? (
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Excellent performance
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Needs attention
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analytics as any)?.alertsSummary?.critical || 0) + ((analytics as any)?.alertsSummary?.high || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(analytics as any)?.alertsSummary?.critical || 0} critical, {(analytics as any)?.alertsSummary?.high || 0} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Execution Performance Trends</CardTitle>
            <CardDescription>Daily execution volume and success rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="executions" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Total Executions"
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Success Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
            <CardDescription>Daily cost breakdown by execution volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost']} />
                <Legend />
                <Bar dataKey="cost" fill="#8884d8" name="Daily Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Performance and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Workflows</CardTitle>
            <CardDescription>Most active workflows by execution count and success rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics as any)?.topPerformingWorkflows?.map((workflow: any, index: number) => (
                <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{workflow.name}</p>
                      <p className="text-xs text-muted-foreground">{workflow.executions} executions</p>
                    </div>
                  </div>
                  <Badge variant={workflow.successRate > 90 ? "default" : workflow.successRate > 70 ? "secondary" : "destructive"}>
                    {workflow.successRate}% success
                  </Badge>
                </div>
              )) || (
                <p className="text-muted-foreground text-sm">No workflow performance data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Performance Alerts</CardTitle>
            <CardDescription>Current system alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(alerts as any) && (alerts as any).length > 0 ? (alerts as any).slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'high' ? 'text-orange-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'high' ? 'destructive' :
                        alert.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.resourceType}: {alert.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm">No active alerts - system is performing well!</p>
              )}
            </div>
            {(alerts as any) && (alerts as any).length > 5 && (
              <Button variant="outline" className="w-full mt-4">
                View All {(alerts as any).length} Alerts
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Distribution and Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alert Severity Distribution</CardTitle>
            <CardDescription>Current alert breakdown by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            {alertSeverityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={alertSeverityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {alertSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>All systems operational!</p>
                  <p className="text-sm">No active alerts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by Workflow</CardTitle>
            <CardDescription>Resource consumption breakdown by workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analytics as any)?.costByWorkflow?.slice(0, 6).map((item: any, index: number) => (
                <div key={item.workflowId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-sm font-mono">
                    {formatCurrency(item.cost)}
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No cost data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}