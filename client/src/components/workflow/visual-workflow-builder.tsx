import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  Plus,
  Settings,
  Trash2,
  Calendar,
  Webhook,
  Bot,
  Database,
  Mail,
  FileText,
  AlertTriangle,
  Save,
  Eye,
  Zap,
  Timer,
  Filter,
  GitBranch as Branch,
  GitMerge as Merge,
  X,
  CheckCircle
} from "lucide-react";
import type { Skill, Agent, Connector, Workflow } from "@shared/schema";

interface Node {
  id: string;
  type: 'trigger' | 'agent' | 'connector' | 'skill' | 'action' | 'condition' | 'delay';
  position: { x: number; y: number };
  data: {
    label: string;
    config: any;
    icon?: React.ComponentType<any>;
    color?: string;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

interface VisualWorkflowBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  editingWorkflow?: Workflow | null;
  onSave: (workflow: any) => void;
}

const nodeTypes = {
  trigger: {
    label: "Triggers",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    items: [
      { id: "schedule", label: "Schedule", icon: Timer, description: "Run on a schedule" },
      { id: "webhook", label: "Webhook", icon: Webhook, description: "Triggered by HTTP request" },
      { id: "manual", label: "Manual", icon: Play, description: "Start manually" },
      { id: "file_upload", label: "File Upload", icon: FileText, description: "When file is uploaded" }
    ]
  },
  agent: {
    label: "Agents",
    icon: Bot,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    items: [] // Will be populated from API
  },
  connector: {
    label: "Connectors",
    icon: Database,
    color: "text-green-600", 
    bgColor: "bg-green-50",
    items: [] // Will be populated from API
  },
  skill: {
    label: "Skills",
    icon: Zap,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    items: [] // Will be populated from API
  },
  action: {
    label: "Actions",
    icon: CheckCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    items: [
      { id: "email", label: "Send Email", icon: Mail, description: "Send notification email" },
      { id: "log", label: "Log Event", icon: FileText, description: "Write to audit log" },
      { id: "webhook_call", label: "Call Webhook", icon: Webhook, description: "HTTP request to external service" }
    ]
  },
  condition: {
    label: "Logic",
    icon: Branch,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    items: [
      { id: "if_condition", label: "If Condition", icon: Branch, description: "Branch based on condition" },
      { id: "filter", label: "Filter", icon: Filter, description: "Filter data based on criteria" },
      { id: "delay", label: "Delay", icon: Timer, description: "Wait for specified time" }
    ]
  }
};

export default function VisualWorkflowBuilder({ isOpen, onClose, editingWorkflow, onSave }: VisualWorkflowBuilderProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: connectors } = useQuery<Connector[]>({
    queryKey: ["/api/connectors"],
  });

  // Populate node types with API data
  const skillItems = skills?.map(skill => ({
    id: skill.id,
    label: skill.name,
    icon: Zap,
    description: skill.description || ""
  })) || [];

  const agentItems = agents?.map(agent => ({
    id: agent.id,
    label: agent.name,
    icon: Bot,
    description: agent.description || ""
  })) || [];

  const connectorItems = connectors?.map(connector => ({
    id: connector.id,
    label: connector.name,
    icon: Database,
    description: `${connector.type} connector`
  })) || [];

  // Update node types with populated data
  const updatedNodeTypes = {
    ...nodeTypes,
    skill: { ...nodeTypes.skill, items: skillItems },
    agent: { ...nodeTypes.agent, items: agentItems },
    connector: { ...nodeTypes.connector, items: connectorItems }
  };

  const handleDragStart = (e: React.DragEvent, nodeType: string, itemId: string) => {
    setDraggedNodeType(`${nodeType}:${itemId}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const [nodeType, itemId] = draggedNodeType.split(':');
    const typeConfig = updatedNodeTypes[nodeType as keyof typeof updatedNodeTypes];
    const item = typeConfig.items.find(i => i.id === itemId);

    if (!item) return;

    const newNode: Node = {
      id: `${nodeType}_${Date.now()}`,
      type: nodeType as any,
      position: { x, y },
      data: {
        label: item.label,
        config: getDefaultConfig(nodeType, itemId),
        icon: item.icon,
        color: typeConfig.color
      }
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedNodeType(null);
  };

  const getDefaultConfig = (nodeType: string, itemId: string) => {
    switch (nodeType) {
      case 'trigger':
        if (itemId === 'schedule') return { cron: '0 9 * * 1' };
        if (itemId === 'webhook') return { endpoint: '/webhook/new-workflow' };
        return {};
      case 'agent':
      case 'connector':
      case 'skill':
        return { id: itemId };
      case 'action':
        if (itemId === 'email') return { recipient: '', subject: '', template: '' };
        return {};
      case 'condition':
        if (itemId === 'if_condition') return { condition: '', trueAction: '', falseAction: '' };
        return {};
      default:
        return {};
    }
  };

  const handleNodeClick = (node: Node) => {
    if (isConnecting && connectionSource) {
      // Create connection
      if (connectionSource !== node.id) {
        const newEdge: Edge = {
          id: `edge_${Date.now()}`,
          source: connectionSource,
          target: node.id
        };
        setEdges(prev => [...prev, newEdge]);
      }
      setIsConnecting(false);
      setConnectionSource(null);
    } else {
      setSelectedNode(node);
      setIsConfiguring(true);
    }
  };

  const handleStartConnection = (nodeId: string) => {
    setIsConnecting(true);
    setConnectionSource(nodeId);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    setIsConfiguring(false);
  };

  const handleUpdateNodeConfig = (nodeId: string, config: any) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, config } }
        : node
    ));
  };

  const handleSaveWorkflow = () => {
    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      definition: {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          config: node.data.config
        })),
        edges: edges.map(edge => ({
          from: edge.source,
          to: edge.target,
          condition: edge.condition
        }))
      },
      isActive: true
    };

    onSave(workflowData);
  };

  const renderNodeConfigDialog = () => {
    if (!selectedNode) return null;

    return (
      <Dialog open={isConfiguring} onOpenChange={setIsConfiguring}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {selectedNode.data.label}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedNode.type === 'trigger' && selectedNode.data.config.cron !== undefined && (
              <div>
                <Label>Cron Expression</Label>
                <Input
                  value={selectedNode.data.config.cron}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                    ...selectedNode.data.config,
                    cron: e.target.value
                  })}
                  placeholder="0 9 * * 1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Example: "0 9 * * 1" runs every Monday at 9 AM
                </p>
              </div>
            )}

            {selectedNode.type === 'trigger' && selectedNode.data.config.endpoint !== undefined && (
              <div>
                <Label>Webhook Endpoint</Label>
                <Input
                  value={selectedNode.data.config.endpoint}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                    ...selectedNode.data.config,
                    endpoint: e.target.value
                  })}
                  placeholder="/webhook/my-workflow"
                />
              </div>
            )}

            {selectedNode.type === 'action' && selectedNode.data.config.recipient !== undefined && (
              <div className="space-y-3">
                <div>
                  <Label>Recipient Email</Label>
                  <Input
                    value={selectedNode.data.config.recipient}
                    onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                      ...selectedNode.data.config,
                      recipient: e.target.value
                    })}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={selectedNode.data.config.subject}
                    onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                      ...selectedNode.data.config,
                      subject: e.target.value
                    })}
                    placeholder="Workflow Notification"
                  />
                </div>
                <div>
                  <Label>Email Template</Label>
                  <Textarea
                    value={selectedNode.data.config.template}
                    onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                      ...selectedNode.data.config,
                      template: e.target.value
                    })}
                    placeholder="Hello, the workflow has completed successfully..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {selectedNode.type === 'condition' && selectedNode.data.config.condition !== undefined && (
              <div>
                <Label>Condition Expression</Label>
                <Input
                  value={selectedNode.data.config.condition}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                    ...selectedNode.data.config,
                    condition: e.target.value
                  })}
                  placeholder="data.amount > 1000"
                />
                <p className="text-sm text-gray-500 mt-1">
                  JavaScript expression to evaluate
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={() => handleDeleteNode(selectedNode.id)}
                data-testid="button-delete-node"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Node
              </Button>
              <Button onClick={() => setIsConfiguring(false)} data-testid="button-save-config">
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {editingWorkflow ? "Edit Workflow" : "Visual Workflow Builder"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[80vh]">
          {/* Left Sidebar - Node Palette */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <Label>Workflow Name</Label>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="My Automation Workflow"
                  data-testid="input-workflow-name"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                  data-testid="textarea-workflow-description"
                />
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-3">Drag Components to Canvas</h3>
                <Tabs defaultValue="trigger" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="trigger" className="text-xs">Triggers</TabsTrigger>
                    <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
                    <TabsTrigger value="logic" className="text-xs">Logic</TabsTrigger>
                  </TabsList>

                  {Object.entries(updatedNodeTypes).map(([key, type]) => (
                    <TabsContent 
                      key={key} 
                      value={key === 'condition' ? 'logic' : key === 'trigger' ? 'trigger' : 'actions'}
                      className="space-y-2"
                    >
                      <div className="space-y-2">
                        {type.items.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Card
                              key={item.id}
                              className="cursor-move hover:shadow-sm transition-shadow"
                              draggable
                              onDragStart={(e) => handleDragStart(e, key, item.id)}
                              data-testid={`node-${key}-${item.id}`}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-8 h-8 rounded ${type.bgColor} flex items-center justify-center`}>
                                    <IconComponent className={`w-4 h-4 ${type.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{item.label}</p>
                                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <Button variant="outline" size="sm" data-testid="button-preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSaveWorkflow}
                disabled={!workflowName || nodes.length === 0}
                size="sm"
                data-testid="button-save-workflow"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Workflow
              </Button>
            </div>

            <div
              ref={canvasRef}
              className="w-full h-full bg-white"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }}
            >
              {/* Render Edges */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {edges.map((edge) => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  
                  if (!sourceNode || !targetNode) return null;

                  const sourceX = sourceNode.position.x + 100; // Adjust for node width
                  const sourceY = sourceNode.position.y + 30;
                  const targetX = targetNode.position.x;
                  const targetY = targetNode.position.y + 30;

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sourceX}
                        y1={sourceY}
                        x2={targetX}
                        y2={targetY}
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6b7280"
                    />
                  </marker>
                </defs>
              </svg>

              {/* Render Nodes */}
              {nodes.map((node) => {
                const IconComponent = node.data.icon || Bot;
                return (
                  <div
                    key={node.id}
                    className="absolute cursor-pointer group"
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      transform: 'translate(0, 0)'
                    }}
                    onClick={() => handleNodeClick(node)}
                    data-testid={`canvas-node-${node.id}`}
                  >
                    <Card className="w-48 hover:shadow-md transition-shadow bg-white border-2 border-gray-200 group-hover:border-blue-300">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <IconComponent className={`w-5 h-5 ${node.data.color || 'text-gray-600'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{node.data.label}</p>
                              <p className="text-xs text-gray-500">{node.type}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartConnection(node.id);
                              }}
                              data-testid={`button-connect-${node.id}`}
                            >
                              <Zap className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNode(node);
                                setIsConfiguring(true);
                              }}
                              data-testid={`button-configure-${node.id}`}
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}

              {/* Empty State */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Build Your Workflow</h3>
                    <p className="text-sm">
                      Drag components from the left panel to create your automation workflow
                    </p>
                  </div>
                </div>
              )}

              {/* Connection Mode Indicator */}
              {isConnecting && (
                <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
                  Click on a node to connect it to the selected source
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 w-6 p-0"
                    onClick={() => {
                      setIsConnecting(false);
                      setConnectionSource(null);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {renderNodeConfigDialog()}
      </DialogContent>
    </Dialog>
  );
}