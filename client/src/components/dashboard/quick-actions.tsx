import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Bot, Plug, Upload, ChevronRight } from "lucide-react";
import SkillWizardModal from "@/components/modals/skill-wizard-modal";

export default function QuickActions() {
  const [isSkillWizardOpen, setIsSkillWizardOpen] = useState(false);

  const actions = [
    {
      title: "Create Skill",
      icon: Wand2,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      onClick: () => setIsSkillWizardOpen(true),
      testId: "action-create-skill"
    },
    {
      title: "Build Agent",
      icon: Bot,
      iconBg: "bg-accent-100",
      iconColor: "text-accent-600",
      onClick: () => {
        // TODO: Implement agent builder
        console.log("Open agent builder");
      },
      testId: "action-build-agent"
    },
    {
      title: "Add Connector",
      icon: Plug,
      iconBg: "bg-orange-100",
      iconColor: "text-warning",
      onClick: () => {
        // TODO: Implement connector setup
        console.log("Open connector setup");
      },
      testId: "action-add-connector"
    },
    {
      title: "Upload Docs",
      icon: Upload,
      iconBg: "bg-green-100",
      iconColor: "text-success",
      onClick: () => {
        // TODO: Implement document upload
        console.log("Open document upload");
      },
      testId: "action-upload-docs"
    }
  ];

  return (
    <>
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {actions.map((action) => (
              <Button
                key={action.title}
                variant="ghost"
                className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 h-auto"
                onClick={action.onClick}
                data-testid={action.testId}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${action.iconBg} rounded-lg flex items-center justify-center`}>
                    <action.icon className={`${action.iconColor} text-sm`} />
                  </div>
                  <span className="font-medium text-gray-900">{action.title}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <SkillWizardModal 
        isOpen={isSkillWizardOpen} 
        onClose={() => setIsSkillWizardOpen(false)} 
      />
    </>
  );
}
