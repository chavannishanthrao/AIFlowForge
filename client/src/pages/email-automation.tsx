import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Clock, Mail, FileText, Zap, Settings, Plus, Play, Pause, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Email component implementations
function EmailAccountFormComponent({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    provider: "gmail",
    isActive: true,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/email-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          credentials: {
            accessToken: "placeholder_access_token",
            refreshToken: "placeholder_refresh_token",
            scope: "https://www.googleapis.com/auth/gmail.readonly"
          }
        }),
      });
      if (!response.ok) throw new Error("Failed to create email account");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Email Account Connected", description: "Your email account has been successfully connected" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Connection Failed", description: "Failed to connect email account", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createAccountMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Account Name *</label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Business Gmail"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email Address *</label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="business@company.com"
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={createAccountMutation.isPending}>
          {createAccountMutation.isPending ? "Connecting..." : "Connect Account"}
        </Button>
      </div>
    </form>
  );
}

function EmailRuleFormComponent({ accountId, onSuccess }: { accountId: string; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    priority: 1,
    isActive: true,
    conditions: {
      senderContains: "",
      subjectContains: "",
      hasAttachments: false,
    },
    actions: {
      extractData: false,
      forwardToNetSuite: false,
      sendNotification: false,
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/email-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          accountId,
          conditions: data.conditions,
          actions: data.actions,
          workflowId: null,
          priority: data.priority,
          isActive: data.isActive,
        }),
      });
      if (!response.ok) throw new Error("Failed to create email rule");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Rule Created", description: "Email automation rule has been created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Creation Failed", description: "Failed to create email rule", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Validation Error", description: "Please provide a rule name", variant: "destructive" });
      return;
    }
    createRuleMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Rule Name *</label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Invoice Processing Rule"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Sender contains</label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.conditions.senderContains}
          onChange={(e) => setFormData({
            ...formData,
            conditions: { ...formData.conditions, senderContains: e.target.value }
          })}
          placeholder="@vendor.com"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Subject contains</label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.conditions.subjectContains}
          onChange={(e) => setFormData({
            ...formData,
            conditions: { ...formData.conditions, subjectContains: e.target.value }
          })}
          placeholder="Invoice"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={createRuleMutation.isPending}>
          {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
        </Button>
      </div>
    </form>
  );
}

function AttachmentProcessorComponent({ selectedAccount }: { selectedAccount: string | null }) {
  if (!selectedAccount) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select an Email Account</h3>
          <p className="text-muted-foreground">Choose an email account to process attachments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Processing</CardTitle>
        <CardDescription>AI-powered attachment processing and data extraction</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Processing System Ready</h3>
          <p className="text-muted-foreground">Attachment processing will be available when emails are received</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmailMessageViewerComponent({ message, onClose }: { message: EmailMessage; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{message.subject || 'No Subject'}</h3>
        <p className="text-sm text-muted-foreground">From: {message.from}</p>
        <p className="text-sm text-muted-foreground">Received: {new Date(message.receivedAt).toLocaleString()}</p>
      </div>
      <div className="border rounded p-4 bg-gray-50">
        <p className="text-sm whitespace-pre-wrap">{message.body || 'No message body available'}</p>
      </div>
      {message.extractedData && (
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-2">Extracted Data:</h4>
          <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto">
            {JSON.stringify(message.extractedData, null, 2)}
          </pre>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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

interface EmailRule {
  id: string;
  name: string;
  accountId: string;
  conditions: any;
  actions: any;
  workflowId: string | null;
  priority: number | null;
  isActive: boolean;
  triggerCount: number | null;
  lastTriggeredAt: string | null;
}

export function EmailAutomationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);

  // Query for email accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<EmailAccount[]>({
    queryKey: ["/api/email-accounts"],
  });

  // Query for email messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<EmailMessage[]>({
    queryKey: ["/api/email-messages", selectedAccount],
    enabled: !!selectedAccount,
  });

  // Query for email rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery<EmailRule[]>({
    queryKey: ["/api/email-rules", selectedAccount],
    enabled: !!selectedAccount,
  });

  // Mutation for syncing email account
  const syncAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`/api/email-sync/${accountId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to sync email account');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Account Synced",
        description: `Processed ${data.processedMessages} of ${data.newMessages} new messages`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email-messages"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync email account",
        variant: "destructive",
      });
    },
  });

  // Mutation for processing email message
  const processMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetch(`/api/email-process/${messageId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to process email message');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.workflowTriggered) {
        toast({
          title: "Workflow Triggered",
          description: `Email processing workflow has been started`,
        });
      } else {
        toast({
          title: "No Rules Matched",
          description: "No automation rules matched this email",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/email-messages"] });
    },
  });

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Automation</h1>
          <p className="text-muted-foreground mt-2">
            Automate email processing workflows with intelligent rule-based triggers
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAccountForm} onOpenChange={setShowAccountForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Email Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Connect Email Account</DialogTitle>
                <DialogDescription>
                  Connect your email account to enable automated processing
                </DialogDescription>
              </DialogHeader>
              <EmailAccountFormComponent onSuccess={() => {
                setShowAccountForm(false);
                queryClient.invalidateQueries({ queryKey: ["/api/email-accounts"] });
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Email Accounts</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="attachments">File Processing</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              accounts.map((account) => (
                <Card key={account.id} className={`cursor-pointer transition-colors ${
                  selectedAccount === account.id ? 'ring-2 ring-blue-500' : ''
                }`} onClick={() => setSelectedAccount(account.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <Badge variant={account.isActive ? "outline" : "secondary"}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {account.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Provider: {account.provider}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          syncAccountMutation.mutate(account.id);
                        }}
                        disabled={syncAccountMutation.isPending}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                    {account.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last sync: {new Date(account.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          {!selectedAccount ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an Email Account</h3>
                <p className="text-muted-foreground">
                  Choose an email account from the Accounts tab to view messages
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Email Messages</CardTitle>
                <CardDescription>
                  Recent messages from the selected email account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-4 p-4">
                        <div className="h-4 bg-gray-200 rounded flex-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="font-medium">
                            {message.from}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {message.subject || 'No Subject'}
                              {message.hasAttachments && (
                                <FileText className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(message.processingStatus)}
                          </TableCell>
                          <TableCell>
                            {new Date(message.receivedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedMessage(message)}
                              >
                                View
                              </Button>
                              {message.processingStatus === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => processMessageMutation.mutate(message.id)}
                                  disabled={processMessageMutation.isPending}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Process
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules">
          {!selectedAccount ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an Email Account</h3>
                <p className="text-muted-foreground">
                  Choose an email account to manage automation rules
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Automation Rules</CardTitle>
                    <CardDescription>
                      Configure rules to automatically process incoming emails
                    </CardDescription>
                  </div>
                  <Dialog open={showRuleForm} onOpenChange={setShowRuleForm}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Create Automation Rule</DialogTitle>
                        <DialogDescription>
                          Set up conditions and actions for automatic email processing
                        </DialogDescription>
                      </DialogHeader>
                      <EmailRuleFormComponent
                        accountId={selectedAccount}
                        onSuccess={() => {
                          setShowRuleForm(false);
                          queryClient.invalidateQueries({ queryKey: ["/api/email-rules"] });
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule) => (
                      <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.isActive ? "outline" : "secondary"}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button size="sm" variant="ghost">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Priority: {rule.priority || 0}</p>
                          <p>Triggered: {rule.triggerCount || 0} times</p>
                          {rule.lastTriggeredAt && (
                            <p>Last triggered: {new Date(rule.lastTriggeredAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {rules.length === 0 && (
                      <div className="text-center py-8">
                        <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Rules Configured</h3>
                        <p className="text-muted-foreground mb-4">
                          Create automation rules to automatically process incoming emails
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentProcessorComponent selectedAccount={selectedAccount} />
        </TabsContent>
      </Tabs>

      {/* Message Viewer Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Email Message</DialogTitle>
            <DialogDescription>
              View message details and processing information
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <EmailMessageViewerComponent
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}