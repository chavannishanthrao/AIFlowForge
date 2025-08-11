import { useState, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw,
  File,
  FileImage,
  FileText as FilePdf,
  FileSpreadsheet,
  Brain,
  Zap
} from "lucide-react";
import type { Document } from "@shared/schema";

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
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
      setSelectedFiles(null);
      setUploadProgress(0);
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

  const uploadFilesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      setIsProcessing(true);
      setUploadProgress(10);
      
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      
      setUploadProgress(30);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      setUploadProgress(70);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload files");
      }
      
      const result = await response.json();
      
      // Simulate processing time
      setUploadProgress(90);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(100);
      
      return result.documents;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsCreateOpen(false);
      setSelectedFiles(null);
      setUploadProgress(0);
      setIsProcessing(false);
      toast({
        title: "Success",
        description: `${results.length} document(s) uploaded and indexed successfully`,
      });
    },
    onError: (error: any) => {
      setIsProcessing(false);
      setUploadProgress(0);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "Failed to upload documents",
      });
    },
  });

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Simple text extraction - in a real app, you'd use proper parsers for different file types
        if (file.type.includes('pdf')) {
          resolve(`[PDF Content] ${file.name}\n\nThis is simulated content extraction from a PDF file. In a production environment, this would use a proper PDF parser to extract the actual text content.`);
        } else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
          resolve(`[Spreadsheet Content] ${file.name}\n\nThis is simulated content extraction from a spreadsheet. In production, this would parse the actual spreadsheet data and convert it to searchable text.`);
        } else if (file.type.includes('image')) {
          resolve(`[Image Content] ${file.name}\n\nThis is simulated OCR content extraction from an image. In production, this would use OCR technology to extract any text visible in the image.`);
        } else {
          resolve(content || `[File Content] ${file.name}\n\nProcessed content from uploaded file.`);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUploadFiles = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files Selected",
        description: "Please select at least one file to upload",
      });
      return;
    }
    uploadFilesMutation.mutate(selectedFiles);
  };

  const getFileIcon = (fileName: string, fileType?: string) => {
    if (fileType?.includes('pdf') || fileName.endsWith('.pdf')) {
      return <FilePdf className="w-5 h-5 text-red-500" />;
    } else if (fileType?.includes('sheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    } else if (fileType?.includes('image')) {
      return <FileImage className="w-5 h-5 text-blue-500" />;
    } else {
      return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

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
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Documents to Knowledge Base</DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </TabsTrigger>
                    <TabsTrigger value="manual">
                      <FileText className="w-4 h-4 mr-2" />
                      Manual Entry
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upload Documents
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Support for PDF, Word, Excel, CSV, TXT, and image files
                      </p>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Select Files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                    
                    {selectedFiles && selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Selected Files:</h4>
                        <div className="space-y-2">
                          {Array.from(selectedFiles).map((file, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              {getFileIcon(file.name, file.type)}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown type'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-primary-500 animate-pulse" />
                          <span className="text-sm font-medium">Processing and generating embeddings...</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <Zap className="w-3 h-3" />
                          <span>
                            {uploadProgress < 70 ? "Extracting content..." : 
                             uploadProgress < 90 ? "Generating vector embeddings..." : 
                             "Indexing in vector database..."}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsCreateOpen(false);
                          setSelectedFiles(null);
                          setUploadProgress(0);
                        }}
                        disabled={isProcessing}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUploadFiles}
                        disabled={!selectedFiles || selectedFiles.length === 0 || isProcessing}
                      >
                        {isProcessing ? "Processing..." : "Upload & Index Documents"}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
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
                  </TabsContent>
                </Tabs>
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
                  {documents?.length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">All documents auto-indexed</p>
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
                        <Badge variant="secondary" className="text-xs">
                          <Brain className="w-3 h-3 mr-1" />
                          Indexed
                        </Badge>
                        {(document.metadata as any)?.fileType && (
                          <Badge variant="outline" className="text-xs">
                            {getFileIcon((document.metadata as any).fileName || document.title, (document.metadata as any).fileType)}
                            <span className="ml-1">
                              {(document.metadata as any).fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                            </span>
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
                        {(document.metadata as any)?.fileSize 
                          ? `${Math.round((document.metadata as any).fileSize / 1024)} KB`
                          : `${Math.round(document.content.length / 1024 * 100) / 100} KB`
                        }
                        {(document.metadata as any)?.fileName && (
                          <span className="ml-2">• Original file</span>
                        )}
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