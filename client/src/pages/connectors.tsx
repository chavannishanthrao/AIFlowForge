import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Plug, Settings, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import type { Connector } from "@shared/schema";

export default function Connectors() {
  const { data: connectors, isLoading } = useQuery<Connector[]>({
    queryKey: ["/api/connectors"],
  });

  const getConnectorIcon = (type: string) => {
    switch (type) {
      case "salesforce":
        return "🔗";
      case "netsuite":
        return "💼";
      case "email":
        return "📧";
      case "slack":
        return "💬";
      default:
        return "🔌";
    }
  };

  const getConnectorColor = (type: string) => {
    switch (type) {
      case "salesforce":
        return "bg-blue-100 text-blue-800";
      case "netsuite":
        return "bg-green-100 text-green-800";
      case "email":
        return "bg-purple-100 text-purple-800";
      case "slack":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Connectors" subtitle="Manage enterprise system connections" />
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
          title="Connectors" 
          subtitle="Manage enterprise system connections"
          action={
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white"
              data-testid="button-create-connector"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Connector
            </Button>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {connectors?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Plug className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No connectors configured</h3>
                <p className="text-gray-600 mb-4">
                  Connect to enterprise systems like Salesforce, NetSuite, and more to enable data integration.
                </p>
                <Button 
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                  data-testid="button-create-first-connector"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Connector
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectors?.map((connector) => (
                <Card key={connector.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                          {getConnectorIcon(connector.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {connector.name}
                          </CardTitle>
                          <Badge className={getConnectorColor(connector.type)} data-testid={`badge-connector-type-${connector.id}`}>
                            {connector.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-edit-connector-${connector.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-delete-connector-${connector.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      <div className="flex items-center space-x-2">
                        {connector.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-sm font-medium text-success" data-testid={`text-connector-status-${connector.id}`}>
                              Connected
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-warning" />
                            <span className="text-sm font-medium text-warning" data-testid={`text-connector-status-${connector.id}`}>
                              Disconnected
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {connector.config && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Configuration:</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {Object.entries(connector.config as Record<string, any>).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span data-testid={`text-config-${connector.id}-${key}`}>
                                {typeof value === "string" ? value : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span data-testid={`text-connector-created-${connector.id}`}>
                        {connector.createdAt ? new Date(connector.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                      {connector.credentials && (
                        <Badge variant="secondary" className="text-xs">
                          Authenticated
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
