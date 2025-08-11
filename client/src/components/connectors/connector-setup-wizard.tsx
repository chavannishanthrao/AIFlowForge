import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Key, 
  Settings, 
  TestTube2,
  ExternalLink,
  Shield,
  Zap
} from "lucide-react";
import { SiSalesforce, SiOracle } from "react-icons/si";

interface ConnectorSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (connector: any) => void;
}

const connectorTypes = [
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Connect to Salesforce CRM for lead management, opportunity tracking, and customer data",
    icon: SiSalesforce,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    features: ["Lead Management", "Opportunity Tracking", "Account Management", "Contact Sync"],
    setupComplexity: "Medium",
    authType: "OAuth 2.0"
  },
  {
    id: "netsuite",
    name: "NetSuite",
    description: "Connect to NetSuite ERP for financial data, inventory management, and business operations",
    icon: SiOracle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    features: ["Financial Data", "Inventory Management", "Order Processing", "Customer Records"],
    setupComplexity: "High",
    authType: "Token-Based"
  },
  {
    id: "email",
    name: "Email Integration",
    description: "Connect email systems for automated communications and notification workflows",
    icon: ({ className }: { className?: string }) => <span className={className}>📧</span>,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    features: ["Send Emails", "Email Templates", "Attachments", "Bulk Operations"],
    setupComplexity: "Low",
    authType: "SMTP/IMAP"
  },
  {
    id: "dynamics",
    name: "Microsoft Dynamics",
    description: "Connect to Microsoft Dynamics for customer relationship management and business processes",
    icon: ({ className }: { className?: string }) => <span className={className}>🏢</span>,
    color: "text-green-600",
    bgColor: "bg-green-50",
    features: ["CRM Integration", "Sales Pipeline", "Customer Service", "Marketing Automation"],
    setupComplexity: "Medium",
    authType: "Azure AD"
  }
];

export default function ConnectorSetupWizard({ isOpen, onClose, onComplete }: ConnectorSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const [connectorData, setConnectorData] = useState({
    name: "",
    description: "",
    type: "",
    config: {} as any,
    credentials: {} as any,
    isActive: false
  });

  const steps = [
    { title: "Select Type", description: "Choose connector type" },
    { title: "Basic Info", description: "Name and description" },
    { title: "Configuration", description: "Setup connection details" },
    { title: "Authentication", description: "Configure credentials" },
    { title: "Test & Review", description: "Verify connection" }
  ];

  const selectedConnector = connectorTypes.find(c => c.id === selectedType);

  const handleTypeSelection = (type: string) => {
    setSelectedType(type);
    setConnectorData(prev => ({ ...prev, type }));
    
    // Auto-advance to next step after type selection
    setTimeout(() => {
      setCurrentStep(1);
    }, 500);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('testing');
    
    // Simulate API call
    setTimeout(() => {
      setConnectionStatus('success');
      setIsTestingConnection(false);
    }, 2000);
  };

  const handleComplete = () => {
    onComplete(connectorData);
    onClose();
  };

  const getConfigFields = () => {
    switch (selectedType) {
      case "salesforce":
        return [
          { key: "instanceUrl", label: "Instance URL", type: "url", placeholder: "https://yourcompany.salesforce.com", required: true },
          { key: "apiVersion", label: "API Version", type: "select", options: ["58.0", "57.0", "56.0"], default: "58.0" },
          { key: "sandbox", label: "Sandbox Environment", type: "boolean", default: false }
        ];
      case "netsuite":
        return [
          { key: "accountId", label: "Account ID", type: "text", placeholder: "1234567", required: true },
          { key: "suiteAppId", label: "SuiteApp ID", type: "text", placeholder: "com.yourcompany.app", required: true },
          { key: "environment", label: "Environment", type: "select", options: ["production", "sandbox"], default: "sandbox" }
        ];
      case "email":
        return [
          { key: "smtpHost", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com", required: true },
          { key: "smtpPort", label: "SMTP Port", type: "number", placeholder: "587", default: "587" },
          { key: "useSSL", label: "Use SSL/TLS", type: "boolean", default: true }
        ];
      case "dynamics":
        return [
          { key: "tenantId", label: "Tenant ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true },
          { key: "resourceUrl", label: "Resource URL", type: "url", placeholder: "https://yourorg.crm.dynamics.com", required: true },
          { key: "apiVersion", label: "API Version", type: "select", options: ["v9.2", "v9.1", "v9.0"], default: "v9.2" }
        ];
      default:
        return [];
    }
  };

  const getCredentialFields = () => {
    switch (selectedType) {
      case "salesforce":
        return [
          { key: "clientId", label: "Client ID", type: "text", placeholder: "Connected App Client ID", required: true },
          { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "Connected App Client Secret", required: true },
          { key: "username", label: "Username", type: "email", placeholder: "admin@yourcompany.com", required: true },
          { key: "password", label: "Password + Security Token", type: "password", placeholder: "passwordSECURITYTOKEN", required: true }
        ];
      case "netsuite":
        return [
          { key: "consumerKey", label: "Consumer Key", type: "text", placeholder: "Integration Consumer Key", required: true },
          { key: "consumerSecret", label: "Consumer Secret", type: "password", placeholder: "Integration Consumer Secret", required: true },
          { key: "tokenId", label: "Token ID", type: "text", placeholder: "Access Token ID", required: true },
          { key: "tokenSecret", label: "Token Secret", type: "password", placeholder: "Access Token Secret", required: true }
        ];
      case "email":
        return [
          { key: "username", label: "Email Address", type: "email", placeholder: "your-email@domain.com", required: true },
          { key: "password", label: "Password/App Password", type: "password", placeholder: "App-specific password", required: true }
        ];
      case "dynamics":
        return [
          { key: "clientId", label: "Client ID", type: "text", placeholder: "Azure App Registration Client ID", required: true },
          { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "Azure App Registration Client Secret", required: true }
        ];
      default:
        return [];
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Connector Type</h3>
              <p className="text-gray-600">Select the system you want to connect to your AI platform</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectorTypes.map((connector) => {
                const IconComponent = connector.icon;
                return (
                  <Card 
                    key={connector.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedType === connector.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTypeSelection(connector.id)}
                    data-testid={`card-connector-${connector.id}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg ${connector.bgColor} flex items-center justify-center`}>
                          <IconComponent className={`w-6 h-6 ${connector.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{connector.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {connector.setupComplexity}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {connector.authType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{connector.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {connector.features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {connector.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{connector.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
              <p className="text-gray-600">Provide a name and description for your connector</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Connector Name</Label>
                <Input
                  id="name"
                  value={connectorData.name}
                  onChange={(e) => setConnectorData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`${selectedConnector?.name} - Production`}
                  data-testid="input-connector-name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={connectorData.description}
                  onChange={(e) => setConnectorData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this connector will be used for..."
                  data-testid="textarea-connector-description"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Configuration</h3>
              <p className="text-gray-600">Configure the connection settings for {selectedConnector?.name}</p>
            </div>
            <div className="space-y-4">
              {getConfigFields().map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === "select" ? (
                    <Select
                      value={connectorData.config[field.key] || field.default}
                      onValueChange={(value) => setConnectorData(prev => ({
                        ...prev,
                        config: { ...prev.config, [field.key]: value }
                      }))}
                    >
                      <SelectTrigger data-testid={`select-${field.key}`}>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "boolean" ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={connectorData.config[field.key] || field.default}
                        onCheckedChange={(checked) => setConnectorData(prev => ({
                          ...prev,
                          config: { ...prev.config, [field.key]: checked }
                        }))}
                        data-testid={`switch-${field.key}`}
                      />
                      <Label className="text-sm text-gray-600">
                        {field.label}
                      </Label>
                    </div>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      value={connectorData.config[field.key] || ""}
                      onChange={(e) => setConnectorData(prev => ({
                        ...prev,
                        config: { ...prev.config, [field.key]: e.target.value }
                      }))}
                      placeholder={field.placeholder}
                      data-testid={`input-${field.key}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication</h3>
              <p className="text-gray-600">Provide credentials to authenticate with {selectedConnector?.name}</p>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                All credentials are encrypted and stored securely. They will only be used to establish connections to your systems.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {getCredentialFields().map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={connectorData.credentials[field.key] || ""}
                    onChange={(e) => setConnectorData(prev => ({
                      ...prev,
                      credentials: { ...prev.credentials, [field.key]: e.target.value }
                    }))}
                    placeholder={field.placeholder}
                    data-testid={`input-credential-${field.key}`}
                  />
                </div>
              ))}
            </div>

            {selectedType === "salesforce" && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Create a Connected App in Salesforce Setup</li>
                  <li>Enable OAuth Settings and select appropriate scopes</li>
                  <li>Copy the Consumer Key as Client ID</li>
                  <li>Copy the Consumer Secret as Client Secret</li>
                </ol>
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Setup Guide
                </Button>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test & Review</h3>
              <p className="text-gray-600">Review your configuration and test the connection</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Configuration Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{selectedConnector?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{connectorData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Authentication:</span>
                  <span className="font-medium">{selectedConnector?.authType}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Connection Status:</span>
                  <div className="flex items-center space-x-2">
                    {connectionStatus === 'idle' && (
                      <Badge variant="outline">Not Tested</Badge>
                    )}
                    {connectionStatus === 'testing' && (
                      <Badge variant="outline" className="text-yellow-600">
                        <Zap className="w-3 h-3 mr-1" />
                        Testing...
                      </Badge>
                    )}
                    {connectionStatus === 'success' && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                    {connectionStatus === 'error' && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                variant="outline"
                data-testid="button-test-connection"
              >
                <TestTube2 className="w-4 h-4 mr-2" />
                {isTestingConnection ? "Testing Connection..." : "Test Connection"}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Connector</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div key={index} className="text-center flex-1">
                <div className={`text-xs ${index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            data-testid="button-previous"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={connectionStatus !== 'success'}
                data-testid="button-complete"
              >
                <Check className="w-4 h-4 mr-2" />
                Create Connector
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentStep === 0 && !selectedType}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}