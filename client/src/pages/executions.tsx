import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Eye, Play, X, Search, RefreshCw } from "lucide-react";
import type { Execution, Workflow } from "@shared/schema";

export default function Executions() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: executions, isLoading: executionsLoading, refetch } = useQuery({
    queryKey: ["/api/executions", selectedWorkflow !== "all" ? selectedWorkflow : undefined].filter(Boolean),
    queryFn: async () => {
      const params = selectedWorkflow !== "all" ? `?workflowId=${selectedWorkflow}` : "";
      const response = await fetch(`/api/executions${params}`);
      if (!response.ok) throw new Error("Failed to fetch executions");
      return response.json() as Promise<Execution[]>;
    },
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
    queryFn: async () => {
      const response = await fetch("/api/workflows");
      if (!response.ok) throw new Error("Failed to fetch workflows");
      return response.json() as Promise<Workflow[]>;
    },
  });

  const filteredExecutions = executions?.filter(execution =>
    execution.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflows?.find(w => w.id === execution.workflowId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      case "running": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getWorkflowName = (workflowId: string | null) => {
    if (!workflowId) return "Unknown Workflow";
    const workflow = workflows?.find(w => w.id === workflowId);
    return workflow?.name || "Unknown Workflow";
  };

  if (executionsLoading || workflowsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header 
            title="Executions" 
            subtitle="Monitor and manage workflow execution history"
          />
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading executions...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Header 
          title="Executions" 
          subtitle="Monitor and manage workflow execution history"
          action={
            <Button onClick={() => refetch()} className="bg-primary-500 hover:bg-primary-600 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          }
        />
        
        <div className="p-6 h-full overflow-auto">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search executions..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All workflows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows</SelectItem>
                {workflows?.map((workflow) => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Executions List */}
          <div className="space-y-4">
            {filteredExecutions.length > 0 ? (
              filteredExecutions.map((execution) => (
                <Card key={execution.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-medium">
                          {getWorkflowName(execution.workflowId)}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          ID: {execution.id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Started:</span>
                        <p className="text-gray-900">
                          {execution.startedAt ? format(new Date(execution.startedAt), "MMM dd, yyyy HH:mm") : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Completed:</span>
                        <p className="text-gray-900">
                          {execution.completedAt ? format(new Date(execution.completedAt), "MMM dd, yyyy HH:mm") : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p className="text-gray-900">
                          {execution.startedAt && execution.completedAt
                            ? `${Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s`
                            : execution.status === "running" ? "Running..." : "N/A"
                          }
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Executed By:</span>
                        <p className="text-gray-900">
                          {execution.executedBy ? "System User" : "Scheduler"}
                        </p>
                      </div>
                    </div>
                    
                    {execution.error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <span className="font-medium text-red-700">Error:</span>
                        <p className="text-red-600 text-sm mt-1">{execution.error}</p>
                      </div>
                    )}

                    {execution.output && typeof execution.output === 'object' && execution.output !== null && Object.keys(execution.output).length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <span className="font-medium text-green-700">Output:</span>
                        <pre className="text-green-600 text-sm mt-1 whitespace-pre-wrap">
                          {JSON.stringify(execution.output as Record<string, any>, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Play className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Executions Found</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    {searchTerm || selectedWorkflow !== "all" 
                      ? "No executions match your current filters. Try adjusting your search criteria."
                      : "No workflow executions have been recorded yet. Executions will appear here once workflows are run."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}