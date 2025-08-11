import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Zap, Eye, Download, AlertCircle, CheckCircle, Clock, Brain, TrendingUp } from "lucide-react";

interface EmailAttachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  processedAt: string | null;
  processingStatus: string;
  extractedData: any;
  createdAt: string;
}

interface EmailMessage {
  id: string;
  from: string;
  subject: string | null;
  receivedAt: string;
}

interface AttachmentProcessorProps {
  selectedAccount: string | null;
}

export function AttachmentProcessor({ selectedAccount }: AttachmentProcessorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAttachment, setSelectedAttachment] = useState<EmailAttachment | null>(null);
  const [extractedDataView, setExtractedDataView] = useState<any>(null);

  // Query for email messages to get attachments
  const { data: messages = [] } = useQuery<EmailMessage[]>({
    queryKey: ["/api/email-messages", selectedAccount],
    enabled: !!selectedAccount,
  });

  // Query for all attachments from messages
  const { data: allAttachments = [], isLoading } = useQuery<EmailAttachment[]>({
    queryKey: ["/api/email-attachments", "all", selectedAccount],
    queryFn: async () => {
      if (!messages.length) return [];
      
      const attachmentPromises = messages.map(async (message) => {
        const response = await fetch(`/api/email-attachments?messageId=${message.id}`);
        if (response.ok) {
          const attachments = await response.json();
          return attachments.map((att: EmailAttachment) => ({
            ...att,
            messageInfo: {
              from: message.from,
              subject: message.subject,
              receivedAt: message.receivedAt
            }
          }));
        }
        return [];
      });
      
      const results = await Promise.all(attachmentPromises);
      return results.flat();
    },
    enabled: !!selectedAccount && messages.length > 0,
  });

  // Mutation for processing attachment
  const processAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await fetch(`/api/email-extract/${attachmentId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to process attachment');
      }
      return response.json();
    },
    onSuccess: (data, attachmentId) => {
      if (data.success) {
        toast({
          title: "Processing Complete",
          description: "Data has been successfully extracted from the attachment",
        });
        setExtractedDataView(data.extractedData);
      } else {
        toast({
          title: "Processing Failed",
          description: data.error || "Failed to extract data",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/email-attachments"] });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    return '📁';
  };

  const renderExtractedData = (data: any) => {
    if (!data) return null;

    const renderValue = (key: string, value: any): JSX.Element => {
      if (value === null || value === undefined) {
        return <span className="text-muted-foreground">N/A</span>;
      }
      
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return (
            <div className="space-y-1">
              {value.map((item, index) => (
                <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                  {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <div className="space-y-2">
              {Object.entries(value).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="font-medium">{k}:</span>
                  {renderValue(k, v)}
                </div>
              ))}
            </div>
          );
        }
      }
      
      if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
        return <span className="font-mono">${value.toFixed(2)}</span>;
      }
      
      return <span>{value.toString()}</span>;
    };

    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="border-b pb-2 last:border-b-0">
            <div className="flex justify-between items-start">
              <span className="font-semibold capitalize text-sm text-muted-foreground">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
              <div className="flex-1 ml-4 text-right">
                {renderValue(key, value)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!selectedAccount) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select an Email Account</h3>
          <p className="text-muted-foreground">
            Choose an email account to view and process attachments
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered File Processing
          </CardTitle>
          <CardDescription>
            Automatically extract structured data from email attachments using advanced AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : allAttachments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Attachments Found</h3>
              <p className="text-muted-foreground">
                No email attachments are available for processing from the selected account
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allAttachments.map((attachment: any) => (
                  <TableRow key={attachment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFileTypeIcon(attachment.mimeType)}</span>
                        <div>
                          <p className="font-medium">{attachment.filename}</p>
                          <p className="text-sm text-muted-foreground">{attachment.mimeType}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{attachment.messageInfo?.from}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-48">
                          {attachment.messageInfo?.subject}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(attachment.processingStatus)}</TableCell>
                    <TableCell>{formatFileSize(attachment.size)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {attachment.processingStatus === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processAttachmentMutation.mutate(attachment.id)}
                            disabled={processAttachmentMutation.isPending}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Process
                          </Button>
                        )}
                        
                        {attachment.extractedData && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Eye className="w-3 h-3 mr-1" />
                                View Data
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Extracted Data: {attachment.filename}
                                </DialogTitle>
                                <DialogDescription>
                                  AI-extracted structured data from the attachment
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[400px] w-full">
                                <div className="p-4">
                                  {renderExtractedData(attachment.extractedData)}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button size="sm" variant="ghost">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data Preview Dialog */}
      <Dialog open={!!extractedDataView} onOpenChange={() => setExtractedDataView(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Newly Extracted Data
            </DialogTitle>
            <DialogDescription>
              Fresh data extracted from the attachment
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] w-full">
            <div className="p-4">
              {extractedDataView && renderExtractedData(extractedDataView)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}