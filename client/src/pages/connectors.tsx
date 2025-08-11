import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Plug, Settings, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Connector } from "@shared/schema";

export default function Connectors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null);
  const [deleteConnectorId, setDeleteConnectorId] = useState<string | null>(null);
  const [newConnector, setNewConnector] = useState({
    name: "",
    type: "",
    config: {} as any,
    description: "",
  });

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

  const createConnectorMutation = useMutation({
    mutationFn: (connector: typeof newConnector) => apiRequest("POST", "/api/connectors", {
      ...connector,
      isActive: false,
      credentials: {},
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      setIsCreateOpen(false);
      setNewConnector({ name: "", type: "", config: {}, description: "" });
      toast({
        title: "Success",
        description: "Connector created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create connector",
        variant: "destructive",
      });
    },
  });

  const updateConnectorMutation = useMutation({
    mutationFn: (connector: Connector) => apiRequest("PUT", `/api/connectors/${connector.id}`, connector),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      setIsEditOpen(false);
      setEditingConnector(null);
      toast({
        title: "Success",
        description: "Connector updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update connector",
        variant: "destructive",
      });
    },
  });

  const deleteConnectorMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/connectors/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      setDeleteConnectorId(null);
      toast({
        title: "Success",
        description: "Connector deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete connector",
        variant: "destructive",
      });
    },
  });

  const handleCreateConnector = () => {
    if (!newConnector.name.trim() || !newConnector.type) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name and type are required",
      });
      return;
    }
    createConnectorMutation.mutate(newConnector);
  };

  const handleEditConnector = (connector: Connector) => {
    setEditingConnector(connector);
    setIsEditOpen(true);
  };

  const handleUpdateConnector = () => {
    if (editingConnector) {
      updateConnectorMutation.mutate(editingConnector);
    }
  };

  const handleDeleteConnector = (id: string) => {
    setDeleteConnectorId(id);
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
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                  data-testid="button-create-connector"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Connector
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Connector</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Connector name..."
                      value={newConnector.name}
                      onChange={(e) => setNewConnector(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={newConnector.type} 
                      onValueChange={(value) => setNewConnector(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select connector type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salesforce">Salesforce</SelectItem>
                        <SelectItem value="netsuite">NetSuite</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="api">Custom API</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Connector description..."
                      value={newConnector.description}
                      onChange={(e) => setNewConnector(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateConnector}
                      disabled={createConnectorMutation.isPending}
                    >
                      {createConnectorMutation.isPending ? "Creating..." : "Create Connector"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                  onClick={() => setIsCreateOpen(true)}
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
                          onClick={() => handleEditConnector(connector)}
                          data-testid={`button-edit-connector-${connector.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteConnector(connector.id)}
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
                                {String(value)}
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
                          {String(connector.credentials) !== '{}' ? 'Authenticated' : 'Not Configured'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Edit Connector Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Connector</DialogTitle>
            </DialogHeader>
            {editingConnector && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editName">Name</Label>
                  <Input
                    id="editName"
                    placeholder="Connector name..."
                    value={editingConnector.name}
                    onChange={(e) => setEditingConnector(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="editType">Type</Label>
                  <Select 
                    value={editingConnector.type} 
                    onValueChange={(value) => setEditingConnector(prev => prev ? { ...prev, type: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select connector type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salesforce">Salesforce</SelectItem>
                      <SelectItem value="netsuite">NetSuite</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="api">Custom API</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    placeholder="Connector description..."
                    value={(editingConnector as any).description || ""}
                    onChange={(e) => setEditingConnector(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateConnector}
                    disabled={updateConnectorMutation.isPending}
                  >
                    {updateConnectorMutation.isPending ? "Updating..." : "Update Connector"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConnectorId} onOpenChange={() => setDeleteConnectorId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Connector</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this connector? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConnectorId && deleteConnectorMutation.mutate(deleteConnectorId)}
                disabled={deleteConnectorMutation.isPending}
              >
                {deleteConnectorMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
