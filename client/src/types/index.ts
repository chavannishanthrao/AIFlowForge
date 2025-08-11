// Re-export shared types
export type {
  User,
  InsertUser,
  Skill,
  InsertSkill,
  Agent,
  InsertAgent,
  Workflow,
  InsertWorkflow,
  Connector,
  InsertConnector,
  Execution,
  InsertExecution,
  AuditLog,
  InsertAuditLog,
  Document,
  InsertDocument,
} from "@shared/schema";

// Frontend-specific types
export interface DashboardStats {
  activeWorkflows: number;
  skills: number;
  successfulExecutions: number;
  connectedSystems: number;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'connector' | 'agent' | 'action' | 'condition';
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface SkillConfig {
  inputFormat?: string;
  outputFormat?: string;
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  validationRules?: string[];
}

export interface AgentConfig {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  model?: string;
}

export interface ConnectorConfig {
  apiVersion?: string;
  environment?: string;
  sandbox?: boolean;
  baseUrl?: string;
}

export interface ExecutionStep {
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SystemHealth {
  component: string;
  status: 'operational' | 'warning' | 'error';
  description: string;
  lastChecked?: Date;
}

// Form validation types
export interface SkillFormData {
  name: string;
  description?: string;
  type: string;
  config: SkillConfig;
  requiredConnectors: string[];
  isActive: boolean;
  aiPrompt?: string;
}

export interface AgentFormData {
  name: string;
  description?: string;
  skillIds: string[];
  promptSettings: AgentConfig;
  memoryPolicy: 'session' | 'persistent' | 'none';
  isActive: boolean;
}

export interface WorkflowFormData {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  isActive: boolean;
  schedule?: string;
}

export interface ConnectorFormData {
  name: string;
  type: string;
  config: ConnectorConfig;
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType;
  badge?: string | number;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
