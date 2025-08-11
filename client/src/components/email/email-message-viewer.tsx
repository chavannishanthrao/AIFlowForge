import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, FileText, Calendar, User, Tag, ExternalLink, Download } from "lucide-react";

interface EmailMessage {
  id: string;
  accountId: string;
  messageId: string;
  from: string;
  to: string;
  subject: string | null;
  body: string | null;
  hasAttachments: boolean;
  receivedAt: string;
  processingStatus: string;
  workflowId: string | null;
  executionId: string | null;
  extractedData: any;
}

interface EmailAttachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  processedAt: string | null;
  processingStatus: string;
  extractedData: any;
}

interface EmailMessageViewerProps {
  message: EmailMessage;
  onClose: () => void;
}

export function EmailMessageViewer({ message, onClose }: EmailMessageViewerProps) {
  // Query for attachments
  const { data: attachments = [] } = useQuery<EmailAttachment[]>({
    queryKey: ["/api/email-attachments", message.id],
    queryFn: async () => {
      const response = await fetch(`/api/email-attachments?messageId=${message.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attachments');
      }
      return response.json();
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{message.subject || 'No Subject'}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {message.from}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(message.receivedAt).toLocaleString()}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(message.processingStatus)}>
            {message.processingStatus}
          </Badge>
        </div>

        <Separator />
      </div>

      {/* Message Body */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Message Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 w-full rounded border p-4">
            <div className="text-sm whitespace-pre-wrap">
              {message.body || 'No message body available'}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Attachments */}
      {message.hasAttachments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Attachments ({attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{attachment.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {attachment.mimeType} • {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(attachment.processingStatus)}>
                      {attachment.processingStatus}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data */}
      {message.extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Extracted Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 w-full rounded border p-4">
              <pre className="text-sm">
                {JSON.stringify(message.extractedData, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Processing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Processing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Message ID:</span>
              <p className="text-muted-foreground font-mono">{message.messageId}</p>
            </div>
            <div>
              <span className="font-medium">Processing Status:</span>
              <p className="text-muted-foreground">{message.processingStatus}</p>
            </div>
            {message.workflowId && (
              <div>
                <span className="font-medium">Triggered Workflow:</span>
                <p className="text-muted-foreground">{message.workflowId}</p>
              </div>
            )}
            {message.executionId && (
              <div>
                <span className="font-medium">Execution ID:</span>
                <p className="text-muted-foreground font-mono">{message.executionId}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}