import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Users, BarChart, CheckCircle, Clock } from "lucide-react";
import type { Workflow, Execution } from "@shared/schema";

interface RecentWorkflowsProps {
  workflows: Workflow[];
  executions: Execution[];
  isLoading: boolean;
}

export default function RecentWorkflows({ workflows, executions, isLoading }: RecentWorkflowsProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Workflows</CardTitle>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combine workflows with their latest executions
  const workflowsWithExecutions = workflows.slice(0, 3).map(workflow => {
    const latestExecution = executions
      .filter(exec => exec.workflowId === workflow.id)
      .sort((a, b) => (b.startedAt ? new Date(b.startedAt).getTime() : 0) - (a.startedAt ? new Date(a.startedAt).getTime() : 0))[0];
    
    return {
      workflow,
      execution: latestExecution
    };
  });

  const getWorkflowIcon = (name: string) => {
    if (name.toLowerCase().includes("invoice")) return FileText;
    if (name.toLowerCase().includes("customer") || name.toLowerCase().includes("onboard")) return Users;
    if (name.toLowerCase().includes("report") || name.toLowerCase().includes("sales")) return BarChart;
    return FileText;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-success text-white" data-testid={`badge-status-${status}`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-yellow-100 text-yellow-800" data-testid={`badge-status-${status}`}>
            <Clock className="w-3 h-3 mr-1" />
            Running
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" data-testid={`badge-status-${status}`}>
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" data-testid="badge-status-never-run">
            Never Run
          </Badge>
        );
    }
  };

  const getTimeAgo = (date?: Date | string) => {
    if (!date) return "Never";
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Workflows</CardTitle>
          <Button 
            variant="link" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0"
            data-testid="button-view-all-workflows"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {workflowsWithExecutions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No workflows found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflowsWithExecutions.map(({ workflow, execution }) => {
              const IconComponent = getWorkflowIcon(workflow.name);
              return (
                <div 
                  key={workflow.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  data-testid={`workflow-item-${workflow.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900" data-testid={`text-workflow-name-${workflow.id}`}>
                        {workflow.name}
                      </h4>
                      <p className="text-sm text-gray-600" data-testid={`text-workflow-description-${workflow.id}`}>
                        {workflow.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(execution?.status)}
                    <p className="text-sm text-gray-600 mt-1" data-testid={`text-workflow-time-${workflow.id}`}>
                      {execution?.startedAt ? getTimeAgo(execution.startedAt) : "N/A"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
