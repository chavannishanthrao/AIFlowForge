import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SkillWizardModal from "@/components/modals/skill-wizard-modal";
import { Plus, Settings, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Skill } from "@shared/schema";

export default function Skills() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: skills, isLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({
        title: "Success",
        description: "Skill deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive",
      });
    },
  });

  const getSkillTypeColor = (type: string) => {
    switch (type) {
      case "data_extraction":
        return "bg-blue-100 text-blue-800";
      case "data_processing":
        return "bg-green-100 text-green-800";
      case "communication":
        return "bg-purple-100 text-purple-800";
      case "analysis":
        return "bg-orange-100 text-orange-800";
      case "automation":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Skills" subtitle="Create and manage AI skills" />
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
          title="Skills" 
          subtitle="Create and manage AI skills"
          action={
            <Button 
              onClick={() => setIsWizardOpen(true)}
              className="bg-primary-500 hover:bg-primary-600 text-white"
              data-testid="button-create-skill"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Skill
            </Button>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {skills?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No skills created</h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first AI skill using our wizard or AI-assisted generator.
                </p>
                <Button 
                  onClick={() => setIsWizardOpen(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                  data-testid="button-create-first-skill"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Skill
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills?.map((skill) => (
                <Card key={skill.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                          {skill.name}
                        </CardTitle>
                        <Badge className={getSkillTypeColor(skill.type)} data-testid={`badge-skill-type-${skill.id}`}>
                          {skill.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-edit-skill-${skill.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteSkillMutation.mutate(skill.id)}
                          disabled={deleteSkillMutation.isPending}
                          data-testid={`button-delete-skill-${skill.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3" data-testid={`text-skill-description-${skill.id}`}>
                      {skill.description || "No description provided"}
                    </p>
                    {skill.requiredConnectors && skill.requiredConnectors.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Required Connectors:</p>
                        <div className="flex flex-wrap gap-1">
                          {skill.requiredConnectors.map((connector) => (
                            <Badge 
                              key={connector} 
                              variant="outline" 
                              className="text-xs"
                              data-testid={`badge-connector-${skill.id}-${connector}`}
                            >
                              {connector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span data-testid={`text-skill-status-${skill.id}`}>
                        {skill.isActive ? "Active" : "Inactive"}
                      </span>
                      <span data-testid={`text-skill-created-${skill.id}`}>
                        {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <SkillWizardModal 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
      />
    </div>
  );
}
