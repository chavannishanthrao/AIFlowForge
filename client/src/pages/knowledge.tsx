import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  FileText, 
  Search, 
  Upload, 
  Trash2, 
  Eye,
  Database,
  RefreshCw
} from "lucide-react";
import type { Document } from "@shared/schema";

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: "",
    content: "",
    metadata: {} as any
  });
  const { toast } = useToast();

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json() as Promise<Document[]>;
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (document: typeof newDocument) => {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      });
      if (!response.ok) throw new Error("Failed to create document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsCreateOpen(false);
      setNewDocument({ title: "", content: "", metadata: {} });
      toast({
        title: "Success",
        description: "Document added to knowledge base successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create document",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document deleted from knowledge base",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete document",
      });
    },
  });

  const filteredDocuments = documents?.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateDocument = () => {
    if (!newDocument.title.trim() || !newDocument.content.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and content are required",
      });
      return;
    }
    createDocumentMutation.mutate(newDocument);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header 
            title="Knowledge Base" 
            subtitle="Manage documents and data sources for RAG operations"
          />
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Header 
          title="Knowledge Base" 
          subtitle="Manage documents and data sources for RAG operations"
          action={
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Document title..."
                      value={newDocument.title}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Document content..."
                      className="min-h-[200px]"
                      value={newDocument.content}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, content: e.target.value }))}
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
                      onClick={handleCreateDocument}
                      disabled={createDocumentMutation.isPending}
                    >
                      {createDocumentMutation.isPending ? "Adding..." : "Add Document"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        
        <div className="p-6 h-full overflow-auto">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">{documents?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Vector Embeddings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {documents?.filter(d => d.embedding).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {Math.round((documents?.reduce((acc, doc) => acc + doc.content.length, 0) || 0) / 1024)} KB
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-medium line-clamp-1">
                          {document.title}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                          {document.createdAt ? format(new Date(document.createdAt), "MMM dd, yyyy") : "N/A"}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        {document.embedding && (
                          <Badge variant="secondary" className="text-xs">
                            Vectorized
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {document.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {Math.round(document.content.length / 1024 * 100) / 100} KB
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteDocumentMutation.mutate(document.id)}
                          disabled={deleteDocumentMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-600 text-center max-w-md mb-4">
                    {searchTerm 
                      ? "No documents match your search criteria. Try adjusting your search terms."
                      : "Your knowledge base is empty. Add documents to enable RAG capabilities for your AI agents."
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Document
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}