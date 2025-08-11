import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsGrid from "@/components/dashboard/stats-grid";
import RecentWorkflows from "@/components/dashboard/recent-workflows";
import QuickActions from "@/components/dashboard/quick-actions";
import SystemStatus from "@/components/dashboard/system-status";
import WorkflowBuilder from "@/components/workflow/workflow-builder";
import AdvancedAnalytics from "@/components/dashboard/advanced-analytics";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ["/api/executions"],
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          subtitle="Monitor and manage your AI orchestration platform"
        />
        
        <main className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b px-6">
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="p-6 space-y-6">
              <StatsGrid stats={stats as any} isLoading={statsLoading} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  <RecentWorkflows 
                    workflows={workflows as any || []} 
                    executions={executions as any || []} 
                    isLoading={workflowsLoading || executionsLoading} 
                  />
                </div>
                <div className="space-y-6">
                  <QuickActions />
                  <SystemStatus />
                </div>
              </div>

              <WorkflowBuilder />
            </TabsContent>
            
            <TabsContent value="analytics" className="h-full">
              <AdvancedAnalytics />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
