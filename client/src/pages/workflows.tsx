import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import VisualWorkflowBuilder from "@/components/workflow/visual-workflow-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Workflow as WorkflowIcon, Settings, Trash2, Play, Calendar, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workflow } from "@shared/schema";

export default function Workflows() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: (workflowId: string) => apiRequest("POST", `/api/workflows/${workflowId}/execute`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow execution started successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start workflow execution",
        variant: "destructive",
      });
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (workflow: any) => apiRequest("POST", "/api/workflows", workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setIsBuilderOpen(false);
      toast({
        title: "Success",
        description: "Workflow created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    },
  });

  const handleSaveWorkflow = (workflowData: any) => {
    createWorkflowMutation.mutate(workflowData);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Workflows" subtitle="Create and manage automation workflows" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Workflows" 
          subtitle="Create and manage automation workflows"
          action={
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white"
              onClick={() => setIsBuilderOpen(true)}
              data-testid="button-create-workflow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Build Workflow
            </Button>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {workflows?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <WorkflowIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows created</h3>
                <p className="text-gray-600 mb-4">
                  Workflows orchestrate agents and skills to automate complex business processes. Create your first workflow to get started.
                </p>
                <Button 
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                  data-testid="button-create-first-workflow"
                  onClick={() => setIsBuilderOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows?.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <WorkflowIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {workflow.name}
                          </CardTitle>
                          <Badge 
                            variant={workflow.isActive ? "default" : "secondary"}
                            data-testid={`badge-workflow-status-${workflow.id}`}
                          >
                            {workflow.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => executeWorkflowMutation.mutate(workflow.id)}
                          disabled={executeWorkflowMutation.isPending}
                          data-testid={`button-execute-workflow-${workflow.id}`}
                        >
                          <Play className="w-4 h-4 text-success" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingWorkflow(workflow);
                            setIsBuilderOpen(true);
                          }}
                          data-testid={`button-edit-workflow-${workflow.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-delete-workflow-${workflow.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3" data-testid={`text-workflow-description-${workflow.id}`}>
                      {workflow.description || "No description provided"}
                    </p>
                    
                    {workflow.schedule && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span data-testid={`text-workflow-schedule-${workflow.id}`}>
                            Scheduled: {workflow.schedule}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Nodes: {(workflow.definition as any)?.nodes?.length || 0}
                      </p>
                      <div className="flex space-x-1">
                        {(workflow.definition as any)?.nodes?.slice(0, 4).map((node: any, index: number) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-xs"
                            data-testid={`badge-node-${workflow.id}-${index}`}
                          >
                            {node.type}
                          </Badge>
                        ))}
                        {((workflow.definition as any)?.nodes?.length || 0) > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{(workflow.definition as any).nodes.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span data-testid={`text-workflow-created-${workflow.id}`}>
                        {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Visual Workflow Builder */}
        <VisualWorkflowBuilder
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingWorkflow(null);
          }}
          editingWorkflow={editingWorkflow}
          onSave={handleSaveWorkflow}
        />
      </div>
    </div>
  );
}
