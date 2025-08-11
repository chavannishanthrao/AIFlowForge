import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Key, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailAccountFormProps {
  onSuccess: () => void;
}

export function EmailAccountForm({ onSuccess }: EmailAccountFormProps) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          credentials: {
            // This would normally be OAuth tokens from Gmail API
            accessToken: "placeholder_access_token",
            refreshToken: "placeholder_refresh_token",
            scope: "https://www.googleapis.com/auth/gmail.readonly"
          }
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create email account");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Account Connected",
        description: "Your email account has been successfully connected",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect email account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createAccountMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          In a production environment, this would initiate OAuth flow with your email provider for secure authentication.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Account Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Business Gmail"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="business@company.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="provider">Email Provider</Label>
          <Select
            value={formData.provider}
            onValueChange={(value) => setFormData({ ...formData, provider: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gmail">Gmail</SelectItem>
              <SelectItem value="outlook">Outlook</SelectItem>
              <SelectItem value="yahoo">Yahoo Mail</SelectItem>
              <SelectItem value="imap">IMAP/SMTP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Enable account immediately</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={createAccountMutation.isPending}>
          {createAccountMutation.isPending ? (
            "Connecting..."
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Connect Account
            </>
          )}
        </Button>
      </div>
    </form>
  );
}