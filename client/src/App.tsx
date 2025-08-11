import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Skills from "@/pages/skills";
import Agents from "@/pages/agents";
import Workflows from "@/pages/workflows";
import Connectors from "@/pages/connectors";
import Executions from "@/pages/executions";
import KnowledgeBase from "@/pages/knowledge";
import { EmailAutomationPage } from "@/pages/email-automation";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/skills" component={Skills} />
      <Route path="/agents" component={Agents} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/connectors" component={Connectors} />
      <Route path="/executions" component={Executions} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/email-automation" component={EmailAutomationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 font-inter">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
