import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Database, 
  Bot, 
  Mail, 
  ChevronRight, 
  ExpandIcon,
  Calendar,
  Plug,
  Play,
  GitBranch
} from "lucide-react";

export default function WorkflowBuilder() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Sample workflow nodes - in a real implementation, this would be dynamic
  const workflowNodes = [
    {
      id: "trigger",
      type: "trigger",
      title: "Weekly Schedule",
      subtitle: "Every Monday 9:00 AM",
      icon: Clock,
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      textColor: "text-blue-900"
    },
    {
      id: "datasource",
      type: "connector",
      title: "NetSuite Connector",
      subtitle: "Fetch pending invoices",
      icon: Database,
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      textColor: "text-green-900"
    },
    {
      id: "agent",
      type: "agent",
      title: "Finance Agent",
      subtitle: "Process & categorize invoices",
      icon: Bot,
      color: "purple",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      textColor: "text-purple-900"
    },
    {
      id: "action",
      type: "action",
      title: "Send Email",
      subtitle: "Report to CFO",
      icon: Mail,
      color: "orange",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      textColor: "text-orange-900"
    }
  ];

  const toolboxComponents = [
    { 
      type: "trigger", 
      label: "Triggers", 
      icon: Clock, 
      description: "Schedule, webhook, or manual triggers",
      testId: "toolbox-triggers"
    },
    { 
      type: "connector", 
      label: "Connectors", 
      icon: Plug, 
      description: "Connect to external systems",
      testId: "toolbox-connectors"
    },
    { 
      type: "agent", 
      label: "Agents", 
      icon: Bot, 
      description: "AI agents with multiple skills",
      testId: "toolbox-agents"
    },
    { 
      type: "action", 
      label: "Actions", 
      icon: Play, 
      description: "Email, notifications, API calls",
      testId: "toolbox-actions"
    },
    { 
      type: "condition", 
      label: "Conditions", 
      icon: GitBranch, 
      description: "If/else logic and branching",
      testId: "toolbox-conditions"
    }
  ];

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  };

  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('text/plain', componentType);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('text/plain');
    console.log(`Dropped component: ${componentType}`);
    // TODO: Implement actual node creation logic
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Workflow Builder - Invoice Processing Sample
          </CardTitle>
          <Button 
            variant="outline" 
            className="text-primary-600 hover:text-primary-700 border-primary-200 hover:bg-primary-50"
            data-testid="button-open-builder"
          >
            <ExpandIcon className="w-4 h-4 mr-2" />
            Open Builder
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Workflow Canvas */}
        <div 
          className="relative mb-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          data-testid="workflow-canvas"
        >
          {/* Workflow Steps */}
          <div className="flex items-center space-x-4 overflow-x-auto pb-4">
            {workflowNodes.map((node, index) => (
              <div key={node.id} className="flex-shrink-0 relative">
                <div 
                  className={`w-48 ${node.bgColor} border-2 ${node.borderColor} rounded-lg p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                    selectedNode === node.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => handleNodeClick(node.id)}
                  data-testid={`workflow-node-${node.id}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <node.icon className={`w-4 h-4 ${node.iconColor}`} />
                    <span className={`text-sm font-medium ${node.textColor}`}>
                      {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {node.title}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {node.subtitle}
                  </p>
                </div>
                
                {/* Connection Arrow */}
                {index < workflowNodes.length - 1 && (
                  <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <div className="w-4 h-0.5 bg-gray-300"></div>
                    <ChevronRight className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Drop Zone Indicator */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 mt-4">
            <p className="text-sm">Drag components from the toolbox below to add new workflow steps</p>
          </div>
        </div>

        {/* Workflow Toolbox */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Available Components</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {toolboxComponents.map((component) => (
              <div
                key={component.type}
                draggable
                onDragStart={(e) => handleDragStart(e, component.type)}
                className="flex flex-col items-center p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                data-testid={component.testId}
              >
                <component.icon className="w-4 h-4 mb-2 text-gray-600" />
                <span className="font-medium text-gray-900 mb-1">{component.label}</span>
                <span className="text-xs text-gray-500 text-center">{component.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Node Configuration</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" data-testid={`selected-node-type-${selectedNode}`}>
                  {workflowNodes.find(n => n.id === selectedNode)?.type}
                </Badge>
                <span className="text-sm font-medium text-gray-900" data-testid={`selected-node-title-${selectedNode}`}>
                  {workflowNodes.find(n => n.id === selectedNode)?.title}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Configure the settings for this workflow step. In a full implementation, this would show context-specific configuration options.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" data-testid={`button-configure-${selectedNode}`}>
                  Configure
                </Button>
                <Button size="sm" variant="outline" data-testid={`button-delete-${selectedNode}`}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
