import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, Zap, Filter, ArrowRight } from "lucide-react";

interface EmailRuleFormProps {
  accountId: string;
  onSuccess: () => void;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export function EmailRuleForm({ accountId, onSuccess }: EmailRuleFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    priority: 1,
    isActive: true,
    workflowId: "",
    conditions: {
      senderContains: "",
      subjectContains: "",
      bodyContains: "",
      hasAttachments: false,
      attachmentTypes: [] as string[],
    },
    actions: {
      extractData: false,
      forwardToNetSuite: false,
      sendNotification: false,
      markAsRead: false,
    },
  });

  // Query for available workflows
  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/email-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          accountId,
          conditions: data.conditions,
          actions: data.actions,
          workflowId: data.workflowId || null,
          priority: data.priority,
          isActive: data.isActive,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create email rule");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rule Created",
        description: "Email automation rule has been created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create email rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Please provide a rule name",
        variant: "destructive",
      });
      return;
    }
    createRuleMutation.mutate(formData);
  };

  const handleAttachmentTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        attachmentTypes: checked
          ? [...prev.conditions.attachmentTypes, type]
          : prev.conditions.attachmentTypes.filter(t => t !== type)
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Rule Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Rule Configuration
          </CardTitle>
          <CardDescription>Basic rule settings and priority</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Invoice Processing Rule"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High (1)</SelectItem>
                  <SelectItem value="2">Medium (2)</SelectItem>
                  <SelectItem value="3">Low (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Enable rule</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Trigger Conditions
          </CardTitle>
          <CardDescription>Define when this rule should be triggered</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="senderContains">Sender contains</Label>
            <Input
              id="senderContains"
              value={formData.conditions.senderContains}
              onChange={(e) => setFormData({
                ...formData,
                conditions: { ...formData.conditions, senderContains: e.target.value }
              })}
              placeholder="@vendor.com"
            />
          </div>

          <div>
            <Label htmlFor="subjectContains">Subject contains</Label>
            <Input
              id="subjectContains"
              value={formData.conditions.subjectContains}
              onChange={(e) => setFormData({
                ...formData,
                conditions: { ...formData.conditions, subjectContains: e.target.value }
              })}
              placeholder="Invoice"
            />
          </div>

          <div>
            <Label htmlFor="bodyContains">Body contains</Label>
            <Input
              id="bodyContains"
              value={formData.conditions.bodyContains}
              onChange={(e) => setFormData({
                ...formData,
                conditions: { ...formData.conditions, bodyContains: e.target.value }
              })}
              placeholder="payment due"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAttachments"
                checked={formData.conditions.hasAttachments}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, hasAttachments: !!checked }
                })}
              />
              <Label htmlFor="hasAttachments">Must have attachments</Label>
            </div>

            {formData.conditions.hasAttachments && (
              <div className="ml-6 space-y-2">
                <Label className="text-sm text-muted-foreground">Attachment types:</Label>
                <div className="flex flex-wrap gap-2">
                  {['pdf', 'xlsx', 'docx', 'csv', 'jpg', 'png'].map(type => (
                    <div key={type} className="flex items-center space-x-1">
                      <Checkbox
                        id={`attachment-${type}`}
                        checked={formData.conditions.attachmentTypes.includes(type)}
                        onCheckedChange={(checked) => handleAttachmentTypeChange(type, !!checked)}
                      />
                      <Label htmlFor={`attachment-${type}`} className="text-sm">
                        .{type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Actions
          </CardTitle>
          <CardDescription>What should happen when conditions are met</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workflowId">Trigger Workflow</Label>
            <Select
              value={formData.workflowId}
              onValueChange={(value) => setFormData({ ...formData, workflowId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a workflow to trigger" />
              </SelectTrigger>
              <SelectContent>
                {workflows.filter(w => w.isActive).map((workflow) => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Additional Actions</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="extractData"
                checked={formData.actions.extractData}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  actions: { ...formData.actions, extractData: !!checked }
                })}
              />
              <Label htmlFor="extractData">Extract data from attachments</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="forwardToNetSuite"
                checked={formData.actions.forwardToNetSuite}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  actions: { ...formData.actions, forwardToNetSuite: !!checked }
                })}
              />
              <Label htmlFor="forwardToNetSuite">Forward extracted data to NetSuite</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendNotification"
                checked={formData.actions.sendNotification}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  actions: { ...formData.actions, sendNotification: !!checked }
                })}
              />
              <Label htmlFor="sendNotification">Send processing notification</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="markAsRead"
                checked={formData.actions.markAsRead}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  actions: { ...formData.actions, markAsRead: !!checked }
                })}
              />
              <Label htmlFor="markAsRead">Mark email as read</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={createRuleMutation.isPending}>
          {createRuleMutation.isPending ? (
            "Creating..."
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Create Rule
            </>
          )}
        </Button>
      </div>
    </form>
  );
}