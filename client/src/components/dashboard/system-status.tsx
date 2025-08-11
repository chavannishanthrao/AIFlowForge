import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemComponent {
  name: string;
  status: "operational" | "warning" | "error";
  description: string;
}

export default function SystemStatus() {
  const systemComponents: SystemComponent[] = [
    {
      name: "API Gateway",
      status: "operational",
      description: "Operational"
    },
    {
      name: "Workflow Engine",
      status: "operational", 
      description: "Operational"
    },
    {
      name: "Vector Database",
      status: "warning",
      description: "High Load"
    },
    {
      name: "Queue System",
      status: "operational",
      description: "Operational"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "error":
        return "bg-error";
      default:
        return "bg-gray-500";
    }
  };

  const overallHealth = 98.2;

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">System Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {systemComponents.map((component) => (
            <div 
              key={component.name} 
              className="flex items-center justify-between"
              data-testid={`system-component-${component.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${getStatusColor(component.status)} rounded-full`}></div>
                <span className="text-sm font-medium text-gray-900">{component.name}</span>
              </div>
              <span 
                className="text-sm text-gray-600"
                data-testid={`system-status-${component.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {component.description}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">System Health</span>
            <span 
              className="font-medium text-success"
              data-testid="text-system-health"
            >
              {overallHealth}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-success h-2 rounded-full transition-all duration-300" 
              style={{ width: `${overallHealth}%` }}
              data-testid="progress-system-health"
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
