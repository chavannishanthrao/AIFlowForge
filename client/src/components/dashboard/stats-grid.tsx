import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Settings, CheckCircle, Plug } from "lucide-react";

interface StatsGridProps {
  stats?: {
    activeWorkflows: number;
    skills: number;
    successfulExecutions: number;
    connectedSystems: number;
  };
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Active Workflows",
      value: stats?.activeWorkflows || 0,
      change: "+12% from last week",
      icon: TrendingUp,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      testId: "stat-active-workflows"
    },
    {
      title: "Skills Created",
      value: stats?.skills || 0,
      change: "+8% from last week",
      icon: Settings,
      iconBg: "bg-accent-100",
      iconColor: "text-accent-600",
      testId: "stat-skills-created"
    },
    {
      title: "Successful Executions",
      value: stats?.successfulExecutions || 0,
      change: "+24% from last week",
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-success",
      testId: "stat-successful-executions"
    },
    {
      title: "Connected Systems",
      value: stats?.connectedSystems || 0,
      change: "All systems operational",
      icon: Plug,
      iconBg: "bg-orange-100",
      iconColor: "text-warning",
      testId: "stat-connected-systems"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((stat) => (
        <Card key={stat.title} className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p 
                  className="text-3xl font-semibold text-gray-900 mt-2" 
                  data-testid={stat.testId}
                >
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-success mt-1">
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  {stat.change}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.iconColor} text-lg`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
