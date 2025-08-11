import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSkillSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wand2, X } from "lucide-react";
import { z } from "zod";

const skillFormSchema = insertSkillSchema.extend({
  aiPrompt: z.string().optional(),
  connectors: z.array(z.string()).optional(),
});

type SkillFormData = z.infer<typeof skillFormSchema>;

interface SkillWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkillWizardModal({ isOpen, onClose }: SkillWizardModalProps) {
  const [generatedSkill, setGeneratedSkill] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "data_processing",
      config: {},
      requiredConnectors: [],
      isActive: true,
      connectors: [],
      aiPrompt: "",
    },
  });

  const generateSkillMutation = useMutation({
    mutationFn: (data: { prompt: string; skillName: string }) =>
      apiRequest("POST", "/api/skills/generate", data),
    onSuccess: (response) => {
      const skillData = response.json();
      setGeneratedSkill(skillData.skill);
      form.setValue("name", skillData.skill.name);
      form.setValue("description", skillData.skill.description);
      form.setValue("type", skillData.skill.type);
      form.setValue("config", skillData.skill.config);
      form.setValue("requiredConnectors", skillData.skill.requiredConnectors);
      toast({
        title: "Success",
        description: "AI-generated skill created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate skill with AI",
        variant: "destructive",
      });
    },
  });

  const createSkillMutation = useMutation({
    mutationFn: (data: SkillFormData) => {
      const { aiPrompt, connectors, ...skillData } = data;
      return apiRequest("POST", "/api/skills", skillData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({
        title: "Success",
        description: "Skill created successfully",
      });
      onClose();
      form.reset();
      setGeneratedSkill(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create skill",
        variant: "destructive",
      });
    },
  });

  const onGenerateSkill = () => {
    const prompt = form.getValues("aiPrompt");
    const skillName = form.getValues("name");
    
    if (!prompt || !skillName) {
      toast({
        title: "Error",
        description: "Please provide both skill name and AI prompt",
        variant: "destructive",
      });
      return;
    }

    generateSkillMutation.mutate({ prompt, skillName });
  };

  const onSubmit = (data: SkillFormData) => {
    createSkillMutation.mutate(data);
  };

  const connectorOptions = [
    { id: "salesforce", label: "Salesforce" },
    { id: "netsuite", label: "NetSuite" },
    { id: "email", label: "Email" },
    { id: "slack", label: "Slack" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Create New Skill
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Use AI assistance to create a new skill or build one manually
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Skill Name */}
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Skill Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Invoice Data Extraction"
              {...form.register("name")}
              data-testid="input-skill-name"
            />
          </div>

          {/* AI-Assisted Generation */}
          <Card className="bg-primary-50 border-primary-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Wand2 className="w-4 h-4 text-primary-600" />
                <h4 className="font-medium text-primary-900">AI-Assisted Generation</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe what this skill should do:
                  </Label>
                  <Textarea
                    id="aiPrompt"
                    rows={3}
                    placeholder="Extract invoice data from PDF documents, including vendor name, amount, due date, and line items. Validate data against business rules and flag any anomalies."
                    {...form.register("aiPrompt")}
                    data-testid="textarea-ai-prompt"
                  />
                </div>
                <Button
                  type="button"
                  onClick={onGenerateSkill}
                  disabled={generateSkillMutation.isPending}
                  className="bg-primary-600 text-white hover:bg-primary-700"
                  data-testid="button-generate-skill"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {generateSkillMutation.isPending ? "Generating..." : "Generate Skill"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Manual Configuration</h4>
            
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Describe what this skill does..."
                {...form.register("description")}
                data-testid="textarea-skill-description"
              />
            </div>

            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Skill Type
              </Label>
              <Select 
                value={form.watch("type")} 
                onValueChange={(value) => form.setValue("type", value as any)}
              >
                <SelectTrigger data-testid="select-skill-type">
                  <SelectValue placeholder="Select skill type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_extraction">Data Extraction</SelectItem>
                  <SelectItem value="data_processing">Data Processing</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="automation">Automation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Required Connectors
              </Label>
              <div className="space-y-2">
                {connectorOptions.map((connector) => (
                  <div key={connector.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={connector.id}
                      checked={form.watch("requiredConnectors")?.includes(connector.id)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("requiredConnectors") || [];
                        if (checked) {
                          form.setValue("requiredConnectors", [...current, connector.id]);
                        } else {
                          form.setValue("requiredConnectors", current.filter(c => c !== connector.id));
                        }
                      }}
                      data-testid={`checkbox-connector-${connector.id}`}
                    />
                    <Label htmlFor={connector.id} className="text-sm text-gray-700">
                      {connector.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Skill Preview */}
          {generatedSkill && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-green-900 mb-2">Generated Skill Preview</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {generatedSkill.name}</div>
                  <div><strong>Type:</strong> {generatedSkill.type}</div>
                  <div><strong>Description:</strong> {generatedSkill.description}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSkillMutation.isPending}
              className="bg-primary-600 text-white hover:bg-primary-700"
              data-testid="button-create-skill"
            >
              {createSkillMutation.isPending ? "Creating..." : "Create Skill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
