import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Plus,
  X,
  Settings,
  Brain,
  Zap,
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  TestTube2,
  Sparkles,
  Target,
  MessageSquare,
  Database
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Skill, Agent, InsertAgent } from "@shared/schema";

interface AgentBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  editingAgent?: Agent | null;
}

const agentTemplates = [
  {
    id: "customer-service",
    name: "Customer Service Agent",
    description: "Handles customer inquiries, support tickets, and provides automated responses",
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    suggestedSkills: ["email", "data_extraction", "communication"],
    promptTemplate: "You are a helpful customer service agent. Always be polite, professional, and aim to resolve customer issues efficiently.",
    memoryPolicy: "session" as const,
    settings: { temperature: 0.3, maxTokens: 500 }
  },
  {
    id: "data-analyst",
    name: "Data Analysis Agent",
    description: "Analyzes data, generates reports, and provides business insights",
    icon: Database,
    color: "text-green-600",
    bgColor: "bg-green-50",
    suggestedSkills: ["data_processing", "analysis", "data_extraction"],
    promptTemplate: "You are a data analyst. Provide clear, accurate analysis and actionable insights from data.",
    memoryPolicy: "persistent" as const,
    settings: { temperature: 0.1, maxTokens: 1000 }
  },
  {
    id: "sales-assistant",
    name: "Sales Assistant",
    description: "Supports sales processes, lead qualification, and customer engagement",
    icon: Target,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    suggestedSkills: ["communication", "data_extraction", "automation"],
    promptTemplate: "You are a sales assistant. Help qualify leads, provide product information, and support the sales process.",
    memoryPolicy: "session" as const,
    settings: { temperature: 0.4, maxTokens: 750 }
  },
  {
    id: "custom",
    name: "Custom Agent",
    description: "Build a completely custom agent with your own configuration",
    icon: Bot,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    suggestedSkills: [],
    promptTemplate: "",
    memoryPolicy: "session" as const,
    settings: { temperature: 0.5, maxTokens: 1000 }
  }
];

export default function AgentBuilder({ isOpen, onClose, editingAgent }: AgentBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  
  const [agentData, setAgentData] = useState<Partial<InsertAgent>>({
    name: "",
    description: "",
    skillIds: [],
    promptSettings: {
      systemPrompt: "",
      temperature: 0.5,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    memoryPolicy: "session",
    credentials: null,
    isActive: true
  });

  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const steps = [
    { title: "Template", description: "Choose a template" },
    { title: "Basic Info", description: "Name and description" },
    { title: "Skills", description: "Select capabilities" },
    { title: "Prompt", description: "Configure AI behavior" },
    { title: "Settings", description: "Advanced configuration" },
    { title: "Test & Review", description: "Verify functionality" }
  ];

  const createAgentMutation = useMutation({
    mutationFn: (agent: Partial<InsertAgent>) => apiRequest("POST", "/api/agents", agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Success",
        description: "Agent created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      });
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: (agent: Agent) => apiRequest("PUT", `/api/agents/${agent.id}`, agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Success",
        description: "Agent updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (editingAgent) {
      setAgentData({
        name: editingAgent.name,
        description: editingAgent.description || "",
        skillIds: editingAgent.skillIds,
        promptSettings: editingAgent.promptSettings,
        memoryPolicy: editingAgent.memoryPolicy,
        credentials: editingAgent.credentials,
        isActive: editingAgent.isActive
      });
      setCurrentStep(1); // Skip template selection for editing
    }
  }, [editingAgent]);

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = agentTemplates.find(t => t.id === templateId);
    
    if (template) {
      setAgentData(prev => ({
        ...prev,
        promptSettings: {
          ...prev.promptSettings!,
          systemPrompt: template.promptTemplate,
          temperature: template.settings.temperature,
          maxTokens: template.settings.maxTokens
        },
        memoryPolicy: template.memoryPolicy
      }));
    }
    
    // Auto-advance to next step after template selection
    setTimeout(() => {
      setCurrentStep(1);
    }, 500);
  };

  const handleSkillToggle = (skillId: string) => {
    setAgentData(prev => ({
      ...prev,
      skillIds: prev.skillIds?.includes(skillId)
        ? prev.skillIds.filter(id => id !== skillId)
        : [...(prev.skillIds || []), skillId]
    }));
  };

  const handleTestAgent = async () => {
    setIsTestingAgent(true);
    
    // Simulate agent testing
    setTimeout(() => {
      setTestResults({
        status: "success",
        response: "Hello! I'm ready to help you. I have access to the skills you've configured and I'm operating according to your prompt settings.",
        metrics: {
          responseTime: "1.2s",
          tokenCount: 45,
          skillsAvailable: agentData.skillIds?.length || 0
        }
      });
      setIsTestingAgent(false);
    }, 3000);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (editingAgent) {
      updateAgentMutation.mutate({ ...editingAgent, ...agentData } as Agent);
    } else {
      createAgentMutation.mutate(agentData);
    }
  };

  const getSkillsByType = (type: string) => {
    return skills?.filter(skill => skill.type === type) || [];
  };

  const getSkillTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      data_extraction: "bg-blue-100 text-blue-800",
      data_processing: "bg-green-100 text-green-800",
      communication: "bg-purple-100 text-purple-800",
      analysis: "bg-orange-100 text-orange-800",
      automation: "bg-red-100 text-red-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Agent Template</h3>
              <p className="text-gray-600">Start with a pre-configured template or build from scratch</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentTemplates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTemplateSelection(template.id)}
                    data-testid={`card-template-${template.id}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg ${template.bgColor} flex items-center justify-center`}>
                          <IconComponent className={`w-6 h-6 ${template.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {template.memoryPolicy === "persistent" ? "Persistent Memory" : "Session Memory"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      {template.suggestedSkills.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Suggested Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.suggestedSkills.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
              <p className="text-gray-600">Give your agent a name and description</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={agentData.name}
                  onChange={(e) => setAgentData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Customer Support Assistant"
                  data-testid="input-agent-name"
                />
              </div>
              
              <div>
                <Label htmlFor="agent-description">Description</Label>
                <Textarea
                  id="agent-description"
                  value={agentData.description}
                  onChange={(e) => setAgentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this agent will do and how it will help users..."
                  rows={4}
                  data-testid="textarea-agent-description"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={agentData.isActive}
                  onCheckedChange={(checked) => setAgentData(prev => ({ ...prev, isActive: checked }))}
                  data-testid="switch-agent-active"
                />
                <Label className="text-sm">
                  Activate agent immediately after creation
                </Label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Skills</h3>
              <p className="text-gray-600">Choose the capabilities your agent will have</p>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="data_extraction">Data</TabsTrigger>
                <TabsTrigger value="data_processing">Processing</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <ScrollArea className="h-64 w-full border rounded-md p-4">
                  <div className="space-y-2">
                    {skills?.map((skill) => (
                      <Card
                        key={skill.id}
                        className={`cursor-pointer transition-all duration-200 p-3 ${
                          agentData.skillIds?.includes(skill.id)
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSkillToggle(skill.id)}
                        data-testid={`card-skill-${skill.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{skill.name}</span>
                              <Badge className={getSkillTypeColor(skill.type)}>
                                {skill.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                          </div>
                          {agentData.skillIds?.includes(skill.id) && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {["data_extraction", "data_processing", "communication", "analysis", "automation"].map((type) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  <ScrollArea className="h-64 w-full border rounded-md p-4">
                    <div className="space-y-2">
                      {getSkillsByType(type).map((skill) => (
                        <Card
                          key={skill.id}
                          className={`cursor-pointer transition-all duration-200 p-3 ${
                            agentData.skillIds?.includes(skill.id)
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSkillToggle(skill.id)}
                          data-testid={`card-skill-${skill.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span className="font-medium">{skill.name}</span>
                              <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                            </div>
                            {agentData.skillIds?.includes(skill.id) && (
                              <Check className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Selected Skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {agentData.skillIds?.map((skillId) => {
                  const skill = skills?.find(s => s.id === skillId);
                  return skill ? (
                    <Badge key={skillId} variant="secondary">
                      {skill.name}
                    </Badge>
                  ) : null;
                })}
                {(!agentData.skillIds || agentData.skillIds.length === 0) && (
                  <p className="text-blue-700 text-sm">No skills selected yet</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure AI Behavior</h3>
              <p className="text-gray-600">Define how your agent will interact and respond</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={agentData.promptSettings?.systemPrompt}
                  onChange={(e) => setAgentData(prev => ({
                    ...prev,
                    promptSettings: { ...prev.promptSettings!, systemPrompt: e.target.value }
                  }))}
                  placeholder="You are a helpful assistant that..."
                  rows={6}
                  data-testid="textarea-system-prompt"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This defines your agent's personality, role, and behavior guidelines
                </p>
              </div>

              <div>
                <Label>Memory Policy</Label>
                <Select
                  value={agentData.memoryPolicy}
                  onValueChange={(value: "session" | "persistent" | "none") => 
                    setAgentData(prev => ({ ...prev, memoryPolicy: value }))
                  }
                >
                  <SelectTrigger data-testid="select-memory-policy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Session Memory</SelectItem>
                    <SelectItem value="persistent">Persistent Memory</SelectItem>
                    <SelectItem value="none">No Memory</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Controls how the agent remembers previous conversations
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Settings</h3>
              <p className="text-gray-600">Fine-tune your agent's AI parameters</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Temperature: {agentData.promptSettings?.temperature}</Label>
                <Slider
                  value={[agentData.promptSettings?.temperature || 0.5]}
                  onValueChange={([value]) => setAgentData(prev => ({
                    ...prev,
                    promptSettings: { ...prev.promptSettings!, temperature: value }
                  }))}
                  max={1}
                  min={0}
                  step={0.1}
                  className="mt-2"
                  data-testid="slider-temperature"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Lower values make responses more focused, higher values more creative
                </p>
              </div>

              <div>
                <Label>Max Tokens: {agentData.promptSettings?.maxTokens}</Label>
                <Slider
                  value={[agentData.promptSettings?.maxTokens || 1000]}
                  onValueChange={([value]) => setAgentData(prev => ({
                    ...prev,
                    promptSettings: { ...prev.promptSettings!, maxTokens: value }
                  }))}
                  max={4000}
                  min={50}
                  step={50}
                  className="mt-2"
                  data-testid="slider-max-tokens"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum length of agent responses
                </p>
              </div>

              <div>
                <Label>Top P: {agentData.promptSettings?.topP}</Label>
                <Slider
                  value={[agentData.promptSettings?.topP || 1]}
                  onValueChange={([value]) => setAgentData(prev => ({
                    ...prev,
                    promptSettings: { ...prev.promptSettings!, topP: value }
                  }))}
                  max={1}
                  min={0}
                  step={0.1}
                  className="mt-2"
                  data-testid="slider-top-p"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Controls diversity of word choices
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test & Review</h3>
              <p className="text-gray-600">Review your agent configuration and test functionality</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <span>Agent Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{agentData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills:</span>
                  <span className="font-medium">{agentData.skillIds?.length || 0} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memory:</span>
                  <span className="font-medium">{agentData.memoryPolicy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temperature:</span>
                  <span className="font-medium">{agentData.promptSettings?.temperature}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="text-center">
                <Button
                  onClick={handleTestAgent}
                  disabled={isTestingAgent}
                  variant="outline"
                  data-testid="button-test-agent"
                >
                  <TestTube2 className="w-4 h-4 mr-2" />
                  {isTestingAgent ? "Testing Agent..." : "Test Agent"}
                </Button>
              </div>

              {testResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>Test Results</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label>Agent Response:</Label>
                        <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                          {testResults.response}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Response Time</p>
                          <p className="font-medium">{testResults.metrics.responseTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Token Count</p>
                          <p className="font-medium">{testResults.metrics.tokenCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Skills Available</p>
                          <p className="font-medium">{testResults.metrics.skillsAvailable}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {editingAgent ? "Edit Agent" : "Create New Agent"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        {!editingAgent && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} />
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div key={index} className="text-center flex-1">
                  <div className={`text-xs ${index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    {step.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || editingAgent}
            data-testid="button-previous"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            {currentStep === steps.length - 1 || editingAgent ? (
              <Button
                onClick={handleSave}
                disabled={!agentData.name || createAgentMutation.isPending || updateAgentMutation.isPending}
                data-testid="button-save"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingAgent ? "Update Agent" : "Create Agent"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentStep === 0 && !selectedTemplate}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}