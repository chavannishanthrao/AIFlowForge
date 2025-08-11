import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AgentBuilder from "@/components/agents/agent-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Bot, Settings, Trash2 } from "lucide-react";
import type { Agent, Skill } from "@shared/schema";

export default function Agents() {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const getSkillName = (skillId: string) => {
    const skill = skills?.find(s => s.id === skillId);
    return skill?.name || skillId;
  };

  if (agentsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Agents" subtitle="Create and manage AI agents" />
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
          title="Agents" 
          subtitle="Create and manage AI agents"
          action={
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white"
              onClick={() => setIsBuilderOpen(true)}
              data-testid="button-create-agent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {agents?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents created</h3>
                <p className="text-gray-600 mb-4">
                  Agents combine multiple skills to perform complex tasks. Create your first agent to get started.
                </p>
                <Button 
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                  onClick={() => setIsBuilderOpen(true)}
                  data-testid="button-create-first-agent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents?.map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-accent-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {agent.name}
                          </CardTitle>
                          <Badge 
                            variant={agent.isActive ? "default" : "secondary"}
                            data-testid={`badge-agent-status-${agent.id}`}
                          >
                            {agent.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingAgent(agent);
                            setIsBuilderOpen(true);
                          }}
                          data-testid={`button-edit-agent-${agent.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-delete-agent-${agent.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3" data-testid={`text-agent-description-${agent.id}`}>
                      {agent.description || "No description provided"}
                    </p>
                    
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Skills ({agent.skillIds?.length || 0}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {agent.skillIds?.slice(0, 3).map((skillId) => (
                          <Badge 
                            key={skillId} 
                            variant="outline" 
                            className="text-xs"
                            data-testid={`badge-skill-${agent.id}-${skillId}`}
                          >
                            {getSkillName(skillId)}
                          </Badge>
                        ))}
                        {agent.skillIds?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.skillIds.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Memory Policy:</p>
                      <Badge variant="secondary" className="text-xs" data-testid={`text-memory-policy-${agent.id}`}>
                        {agent.memoryPolicy}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span data-testid={`text-agent-created-${agent.id}`}>
                        {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Agent Builder */}
        <AgentBuilder
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingAgent(null);
          }}
          editingAgent={editingAgent}
        />
      </div>
    </div>
  );
}
