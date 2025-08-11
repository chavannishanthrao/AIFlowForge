import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-page-title">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1" data-testid="text-page-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {action || (
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white"
              data-testid="button-create-workflow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
