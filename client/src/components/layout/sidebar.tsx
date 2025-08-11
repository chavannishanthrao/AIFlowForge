import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Settings, 
  Bot, 
  Workflow, 
  Plug, 
  Play, 
  Database,
  Users,
  FileText,
  Sliders,
  Brain,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Skills", href: "/skills", icon: Settings },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Connectors", href: "/connectors", icon: Plug },
  { name: "Executions", href: "/executions", icon: Play },
  { name: "Knowledge Base", href: "/knowledge", icon: Database },
];

const adminNavigation = [
  { name: "Users & Roles", href: "/admin/users", icon: Users },
  { name: "Audit Logs", href: "/admin/audit", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Sliders },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Brain className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AIOrchestra</h1>
            <p className="text-sm text-gray-500">Enterprise Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg font-medium transition-colors",
                      isActive
                        ? "text-primary-600 bg-primary-50"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Administration
          </h3>
          <ul className="space-y-2">
            {adminNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a 
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg font-medium transition-colors",
                        isActive
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" data-testid="text-user-name">John Doe</p>
            <p className="text-xs text-gray-500 truncate" data-testid="text-user-role">Platform Admin</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}
