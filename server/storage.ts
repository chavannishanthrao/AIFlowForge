import { 
  type User, type InsertUser, type Skill, type InsertSkill,
  type Agent, type InsertAgent, type Workflow, type InsertWorkflow,
  type Connector, type InsertConnector, type Execution, type InsertExecution,
  type AuditLog, type InsertAuditLog, type Document, type InsertDocument,
  type ExecutionMetric, type InsertExecutionMetric,
  type PerformanceAlert, type InsertPerformanceAlert,
  type UsageStat, type InsertUsageStat
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Skills
  getSkills(): Promise<Skill[]>;
  getSkill(id: string): Promise<Skill | undefined>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: string, skill: Partial<InsertSkill>): Promise<Skill | undefined>;
  deleteSkill(id: string): Promise<boolean>;
  
  // Agents
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, agent: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;
  
  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;
  
  // Connectors
  getConnectors(): Promise<Connector[]>;
  getConnector(id: string): Promise<Connector | undefined>;
  createConnector(connector: InsertConnector): Promise<Connector>;
  updateConnector(id: string, connector: Partial<InsertConnector>): Promise<Connector | undefined>;
  deleteConnector(id: string): Promise<boolean>;
  
  // Executions
  getExecutions(workflowId?: string): Promise<Execution[]>;
  getExecution(id: string): Promise<Execution | undefined>;
  createExecution(execution: InsertExecution): Promise<Execution>;
  updateExecution(id: string, execution: Partial<InsertExecution>): Promise<Execution | undefined>;
  
  // Audit Logs
  getAuditLogs(userId?: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    activeWorkflows: number;
    skills: number;
    successfulExecutions: number;
    connectedSystems: number;
  }>;
  
  // Advanced Analytics Methods
  getExecutionMetrics(workflowId?: string, timeRange?: 'hour' | 'day' | 'week' | 'month'): Promise<ExecutionMetric[]>;
  getPerformanceAlerts(severity?: string): Promise<PerformanceAlert[]>;
  getUsageStats(timeRange?: 'day' | 'week' | 'month'): Promise<UsageStat[]>;
  createExecutionMetric(metric: InsertExecutionMetric): Promise<ExecutionMetric>;
  createPerformanceAlert(alert: InsertPerformanceAlert): Promise<PerformanceAlert>;
  createUsageStat(stat: InsertUsageStat): Promise<UsageStat>;
  getAdvancedAnalytics(): Promise<{
    totalCostThisMonth: number;
    averageExecutionTime: number;
    successRate: number;
    topPerformingWorkflows: Array<{ id: string; name: string; executions: number; successRate: number }>;
    costByWorkflow: Array<{ workflowId: string; name: string; cost: number }>;
    alertsSummary: { critical: number; high: number; medium: number; low: number };
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private skills: Map<string, Skill> = new Map();
  private agents: Map<string, Agent> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private connectors: Map<string, Connector> = new Map();
  private executions: Map<string, Execution> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private documents: Map<string, Document> = new Map();
  private executionMetrics: Map<string, ExecutionMetric> = new Map();
  private performanceAlerts: Map<string, PerformanceAlert> = new Map();
  private usageStats: Map<string, UsageStat> = new Map();

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      email: "admin@example.com",
      password: "hashed_password",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample connectors
    const netsuiteConnector: Connector = {
      id: randomUUID(),
      name: "NetSuite Production",
      type: "netsuite",
      config: { apiVersion: "2021.1", environment: "production" },
      credentials: { encrypted: "encrypted_oauth_token" },
      isActive: true,
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.connectors.set(netsuiteConnector.id, netsuiteConnector);

    const salesforceConnector: Connector = {
      id: randomUUID(),
      name: "Salesforce CRM",
      type: "salesforce",
      config: { apiVersion: "58.0", sandbox: false },
      credentials: { encrypted: "encrypted_oauth_token" },
      isActive: true,
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.connectors.set(salesforceConnector.id, salesforceConnector);

    // Create sample skills
    const invoiceSkill: Skill = {
      id: randomUUID(),
      name: "Invoice Data Extraction",
      description: "Extract invoice data from PDF documents",
      type: "data_extraction",
      config: {
        inputFormat: "pdf",
        outputFields: ["vendor", "amount", "dueDate", "lineItems"],
        validationRules: ["amount > 0", "dueDate is future date"]
      },
      requiredConnectors: ["netsuite"],
      isActive: true,
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.skills.set(invoiceSkill.id, invoiceSkill);

    // Create sample agent
    const financeAgent: Agent = {
      id: randomUUID(),
      name: "Finance Agent",
      description: "Processes financial documents and transactions",
      skillIds: [invoiceSkill.id],
      promptSettings: {
        temperature: 0.2,
        maxTokens: 1000,
        systemPrompt: "You are a finance expert assistant."
      },
      memoryPolicy: "session",
      credentials: null,
      isActive: true,
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.agents.set(financeAgent.id, financeAgent);

    // Create sample workflow
    const invoiceWorkflow: Workflow = {
      id: randomUUID(),
      name: "Invoice Processing - Weekly",
      description: "Automated weekly invoice processing workflow",
      definition: {
        nodes: [
          { id: "trigger", type: "schedule", config: { cron: "0 9 * * 1" } },
          { id: "netsuite", type: "connector", config: { connectorId: netsuiteConnector.id } },
          { id: "agent", type: "agent", config: { agentId: financeAgent.id } },
          { id: "email", type: "action", config: { recipient: "cfo@company.com" } }
        ],
        edges: [
          { from: "trigger", to: "netsuite" },
          { from: "netsuite", to: "agent" },
          { from: "agent", to: "email" }
        ]
      },
      isActive: true,
      schedule: "0 9 * * 1",
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(invoiceWorkflow.id, invoiceWorkflow);

    // Create sample executions
    const execution1: Execution = {
      id: randomUUID(),
      workflowId: invoiceWorkflow.id,
      status: "success",
      input: { triggerType: "schedule" },
      output: { processedInvoices: 15, emailSent: true },
      error: null,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      executedBy: adminUser.id,
    };
    this.executions.set(execution1.id, execution1);

    // Additional sample execution
    const execution2: Execution = {
      id: randomUUID(),
      workflowId: invoiceWorkflow.id,
      status: "running",
      input: { triggerType: "manual" },
      output: {},
      error: null,
      startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      completedAt: null,
      executedBy: adminUser.id,
    };
    this.executions.set(execution2.id, execution2);

    // Create additional workflow - Customer Onboarding
    const onboardingWorkflow: Workflow = {
      id: randomUUID(),
      name: "Customer Onboarding Automation",
      description: "Automated customer onboarding process with welcome emails and account setup",
      definition: {
        nodes: [
          { id: "trigger", type: "webhook", config: { endpoint: "/webhook/new-customer" } },
          { id: "salesforce", type: "connector", config: { connectorId: salesforceConnector.id } },
          { id: "welcome", type: "skill", config: { skillId: invoiceSkill.id } },
          { id: "notify", type: "action", config: { recipient: "support@company.com" } }
        ],
        edges: [
          { from: "trigger", to: "salesforce" },
          { from: "salesforce", to: "welcome" },
          { from: "welcome", to: "notify" }
        ]
      },
      isActive: true,
      schedule: null,
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(onboardingWorkflow.id, onboardingWorkflow);

    // Initialize sample analytics data for demonstration
    const metric1: ExecutionMetric = {
      id: randomUUID(),
      executionId: execution1.id,
      workflowId: invoiceWorkflow.id,
      agentId: financeAgent.id,
      duration: 5000, // 5 seconds
      tokensUsed: 1250,
      cost: 15, // 15 cents
      memoryUsed: 128,
      errorCount: 0,
      retryCount: 0,
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    };
    this.executionMetrics.set(metric1.id, metric1);

    const metric2: ExecutionMetric = {
      id: randomUUID(),
      executionId: execution2.id,
      workflowId: onboardingWorkflow.id,
      agentId: financeAgent.id,
      duration: 12000, // 12 seconds
      tokensUsed: 850,
      cost: 10, // 10 cents
      memoryUsed: 96,
      errorCount: 1,
      retryCount: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    };
    this.executionMetrics.set(metric2.id, metric2);

    // Initialize performance alerts
    const alert1: PerformanceAlert = {
      id: randomUUID(),
      type: "high_latency",
      severity: "high",
      message: "Workflow execution time exceeded 10 seconds threshold",
      resourceType: "workflow",
      resourceId: onboardingWorkflow.id,
      threshold: { maxLatency: 10000 },
      currentValue: { actualLatency: 12000 },
      isResolved: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 25),
      resolvedAt: null,
    };
    this.performanceAlerts.set(alert1.id, alert1);

    const alert2: PerformanceAlert = {
      id: randomUUID(),
      type: "high_error_rate",
      severity: "medium",
      message: "Error rate is above 20% for this workflow",
      resourceType: "workflow",
      resourceId: onboardingWorkflow.id,
      threshold: { maxErrorRate: 0.2 },
      currentValue: { actualErrorRate: 0.5 },
      isResolved: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
      resolvedAt: null,
    };
    this.performanceAlerts.set(alert2.id, alert2);

    // Initialize usage stats for analytics charts
    const todayStats: UsageStat = {
      id: randomUUID(),
      date: new Date(),
      totalExecutions: 25,
      successfulExecutions: 20,
      failedExecutions: 5,
      totalCost: 250, // $2.50
      totalTokens: 15000,
      averageLatency: 3500,
      peakConcurrency: 8,
      activeUsers: 3,
    };
    this.usageStats.set(todayStats.id, todayStats);

    const yesterdayStats: UsageStat = {
      id: randomUUID(),
      date: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
      totalExecutions: 42,
      successfulExecutions: 38,
      failedExecutions: 4,
      totalCost: 420, // $4.20
      totalTokens: 28000,
      averageLatency: 2800,
      peakConcurrency: 12,
      activeUsers: 5,
    };
    this.usageStats.set(yesterdayStats.id, yesterdayStats);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      role: insertUser.role || "user",
      email: insertUser.email,
      username: insertUser.username,
      password: insertUser.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...updateData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Skills
  async getSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }

  async getSkill(id: string): Promise<Skill | undefined> {
    return this.skills.get(id);
  }

  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const id = randomUUID();
    const skill: Skill = {
      id,
      type: insertSkill.type,
      name: insertSkill.name,
      description: insertSkill.description || null,
      config: insertSkill.config,
      requiredConnectors: insertSkill.requiredConnectors || null,
      isActive: insertSkill.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: insertSkill.createdBy || null,
    };
    this.skills.set(id, skill);
    return skill;
  }

  async updateSkill(id: string, updateData: Partial<InsertSkill>): Promise<Skill | undefined> {
    const skill = this.skills.get(id);
    if (!skill) return undefined;
    
    const updatedSkill: Skill = { ...skill, ...updateData, updatedAt: new Date() };
    this.skills.set(id, updatedSkill);
    return updatedSkill;
  }

  async deleteSkill(id: string): Promise<boolean> {
    return this.skills.delete(id);
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const agent: Agent = {
      id,
      name: insertAgent.name,
      description: insertAgent.description || null,
      credentials: insertAgent.credentials || null,
      isActive: insertAgent.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: insertAgent.createdBy || null,
      skillIds: insertAgent.skillIds || [],
      promptSettings: insertAgent.promptSettings,
      memoryPolicy: insertAgent.memoryPolicy || "session",
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: string, updateData: Partial<InsertAgent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent: Agent = { ...agent, ...updateData, updatedAt: new Date() };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const workflow: Workflow = {
      id,
      name: insertWorkflow.name,
      description: insertWorkflow.description || null,
      definition: insertWorkflow.definition,
      isActive: insertWorkflow.isActive ?? true,
      schedule: insertWorkflow.schedule || null,
      createdBy: insertWorkflow.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updateData: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow: Workflow = { ...workflow, ...updateData, updatedAt: new Date() };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Connectors
  async getConnectors(): Promise<Connector[]> {
    return Array.from(this.connectors.values());
  }

  async getConnector(id: string): Promise<Connector | undefined> {
    return this.connectors.get(id);
  }

  async createConnector(insertConnector: InsertConnector): Promise<Connector> {
    const id = randomUUID();
    const connector: Connector = {
      id,
      name: insertConnector.name,
      type: insertConnector.type,
      config: insertConnector.config,
      credentials: insertConnector.credentials || null,
      isActive: insertConnector.isActive ?? true,
      createdBy: insertConnector.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.connectors.set(id, connector);
    return connector;
  }

  async updateConnector(id: string, updateData: Partial<InsertConnector>): Promise<Connector | undefined> {
    const connector = this.connectors.get(id);
    if (!connector) return undefined;
    
    const updatedConnector: Connector = { ...connector, ...updateData, updatedAt: new Date() };
    this.connectors.set(id, updatedConnector);
    return updatedConnector;
  }

  async deleteConnector(id: string): Promise<boolean> {
    return this.connectors.delete(id);
  }

  // Executions
  async getExecutions(workflowId?: string): Promise<Execution[]> {
    let executions = Array.from(this.executions.values());
    if (workflowId) {
      executions = executions.filter(exec => exec.workflowId === workflowId);
    }
    return executions.sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getExecution(id: string): Promise<Execution | undefined> {
    return this.executions.get(id);
  }

  async createExecution(insertExecution: InsertExecution): Promise<Execution> {
    const id = randomUUID();
    const execution: Execution = {
      id,
      workflowId: insertExecution.workflowId || null,
      status: insertExecution.status || "pending",
      input: insertExecution.input || null,
      output: insertExecution.output || null,
      error: insertExecution.error || null,
      startedAt: new Date(),
      completedAt: insertExecution.completedAt || null,
      executedBy: insertExecution.executedBy || null,
    };
    this.executions.set(id, execution);
    return execution;
  }

  async updateExecution(id: string, updateData: Partial<InsertExecution>): Promise<Execution | undefined> {
    const execution = this.executions.get(id);
    if (!execution) return undefined;
    
    const updatedExecution: Execution = { ...execution, ...updateData };
    this.executions.set(id, updatedExecution);
    return updatedExecution;
  }

  // Audit Logs
  async getAuditLogs(userId?: string): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values());
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    return logs.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      id,
      action: insertLog.action,
      resourceType: insertLog.resourceType,
      resourceId: insertLog.resourceId || null,
      userId: insertLog.userId || null,
      details: insertLog.details || null,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  // Documents
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      id,
      title: insertDocument.title,
      content: insertDocument.content,
      metadata: insertDocument.metadata || null,
      embedding: insertDocument.embedding || null,
      uploadedBy: insertDocument.uploadedBy || null,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeWorkflows: number;
    skills: number;
    successfulExecutions: number;
    connectedSystems: number;
  }> {
    const activeWorkflows = Array.from(this.workflows.values()).filter(w => w.isActive).length;
    const skills = this.skills.size;
    const successfulExecutions = Array.from(this.executions.values()).filter(e => e.status === "success").length;
    const connectedSystems = Array.from(this.connectors.values()).filter(c => c.isActive).length;

    return {
      activeWorkflows,
      skills,
      successfulExecutions,
      connectedSystems,
    };
  }

  // Advanced Analytics Methods
  async getExecutionMetrics(workflowId?: string, timeRange?: 'hour' | 'day' | 'week' | 'month'): Promise<ExecutionMetric[]> {
    let metrics = Array.from(this.executionMetrics.values());
    
    if (workflowId) {
      metrics = metrics.filter(m => m.workflowId === workflowId);
    }
    
    if (timeRange) {
      const now = new Date();
      const cutoff = new Date();
      
      switch (timeRange) {
        case 'hour':
          cutoff.setHours(now.getHours() - 1);
          break;
        case 'day':
          cutoff.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      metrics = metrics.filter(m => m.timestamp && new Date(m.timestamp) >= cutoff);
    }
    
    return metrics.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getPerformanceAlerts(severity?: string): Promise<PerformanceAlert[]> {
    let alerts = Array.from(this.performanceAlerts.values()).filter(a => !a.isResolved);
    
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    
    return alerts.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getUsageStats(timeRange?: 'day' | 'week' | 'month'): Promise<UsageStat[]> {
    let stats = Array.from(this.usageStats.values());
    
    if (timeRange) {
      const now = new Date();
      const cutoff = new Date();
      
      switch (timeRange) {
        case 'day':
          cutoff.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      stats = stats.filter(s => s.date && new Date(s.date) >= cutoff);
    }
    
    return stats.sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createExecutionMetric(insertMetric: InsertExecutionMetric): Promise<ExecutionMetric> {
    const id = randomUUID();
    const metric: ExecutionMetric = {
      id,
      executionId: insertMetric.executionId || null,
      workflowId: insertMetric.workflowId || null,
      agentId: insertMetric.agentId || null,
      duration: insertMetric.duration || null,
      tokensUsed: insertMetric.tokensUsed || 0,
      cost: insertMetric.cost || 0,
      memoryUsed: insertMetric.memoryUsed || 0,
      errorCount: insertMetric.errorCount || 0,
      retryCount: insertMetric.retryCount || 0,
      timestamp: new Date(),
    };
    this.executionMetrics.set(id, metric);
    return metric;
  }

  async createPerformanceAlert(insertAlert: InsertPerformanceAlert): Promise<PerformanceAlert> {
    const id = randomUUID();
    const alert: PerformanceAlert = {
      id,
      type: insertAlert.type,
      severity: insertAlert.severity || "medium",
      message: insertAlert.message,
      resourceType: insertAlert.resourceType,
      resourceId: insertAlert.resourceId || null,
      threshold: insertAlert.threshold || null,
      currentValue: insertAlert.currentValue || null,
      isResolved: insertAlert.isResolved || false,
      createdAt: new Date(),
      resolvedAt: insertAlert.resolvedAt || null,
    };
    this.performanceAlerts.set(id, alert);
    return alert;
  }

  async createUsageStat(insertStat: InsertUsageStat): Promise<UsageStat> {
    const id = randomUUID();
    const stat: UsageStat = {
      id,
      date: insertStat.date,
      totalExecutions: insertStat.totalExecutions || 0,
      successfulExecutions: insertStat.successfulExecutions || 0,
      failedExecutions: insertStat.failedExecutions || 0,
      totalCost: insertStat.totalCost || 0,
      totalTokens: insertStat.totalTokens || 0,
      averageLatency: insertStat.averageLatency || 0,
      peakConcurrency: insertStat.peakConcurrency || 0,
      activeUsers: insertStat.activeUsers || 0,
    };
    this.usageStats.set(id, stat);
    return stat;
  }

  async getAdvancedAnalytics(): Promise<{
    totalCostThisMonth: number;
    averageExecutionTime: number;
    successRate: number;
    topPerformingWorkflows: Array<{ id: string; name: string; executions: number; successRate: number }>;
    costByWorkflow: Array<{ workflowId: string; name: string; cost: number }>;
    alertsSummary: { critical: number; high: number; medium: number; low: number };
    agentPerformanceMetrics: Array<{ id: string; name: string; executions: number; averageTime: number; successRate: number; tokensUsed: number; cost: number }>;
    optimizationSuggestions: Array<{ type: string; title: string; description: string; priority: 'high' | 'medium' | 'low'; potentialSavings?: number }>;
    usagePatterns: { peakHours: number[]; mostActiveWorkflows: string[]; resourceBottlenecks: string[] };
  }> {
    const now = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(now.getMonth() - 1);
    
    // Calculate costs from metrics
    const recentMetrics = Array.from(this.executionMetrics.values())
      .filter(m => m.timestamp && new Date(m.timestamp) >= monthAgo);
    
    const totalCostThisMonth = recentMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const averageExecutionTime = recentMetrics.length > 0 
      ? Math.round(recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / recentMetrics.length)
      : 0;
    
    // Calculate success rate
    const recentExecutions = Array.from(this.executions.values())
      .filter(e => e.startedAt && new Date(e.startedAt) >= monthAgo);
    const successfulExecutions = recentExecutions.filter(e => e.status === 'success').length;
    const successRate = recentExecutions.length > 0 
      ? Math.round((successfulExecutions / recentExecutions.length) * 100) 
      : 0;
    
    // Get top performing workflows
    const workflowStats = new Map();
    const workflows = Array.from(this.workflows.values());
    
    workflows.forEach(workflow => {
      const workflowExecutions = recentExecutions.filter(e => e.workflowId === workflow.id);
      const successful = workflowExecutions.filter(e => e.status === 'success').length;
      const successRate = workflowExecutions.length > 0 ? Math.round((successful / workflowExecutions.length) * 100) : 0;
      
      workflowStats.set(workflow.id, {
        id: workflow.id,
        name: workflow.name,
        executions: workflowExecutions.length,
        successRate
      });
    });
    
    const topPerformingWorkflows = Array.from(workflowStats.values())
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 5);
    
    // Calculate cost by workflow
    const costByWorkflow = workflows.map(workflow => {
      const workflowMetrics = recentMetrics.filter(m => m.workflowId === workflow.id);
      const cost = workflowMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
      return {
        workflowId: workflow.id,
        name: workflow.name,
        cost
      };
    }).sort((a, b) => b.cost - a.cost);
    
    // Calculate alerts summary
    const activeAlerts = Array.from(this.performanceAlerts.values()).filter(a => !a.isResolved);
    const alertsSummary = {
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      high: activeAlerts.filter(a => a.severity === 'high').length,
      medium: activeAlerts.filter(a => a.severity === 'medium').length,
      low: activeAlerts.filter(a => a.severity === 'low').length,
    };
    
    // Calculate agent performance metrics
    const agents = Array.from(this.agents.values());
    const agentPerformanceMetrics = agents.map(agent => {
      const agentMetrics = recentMetrics.filter(m => m.agentId === agent.id);
      const agentExecutions = recentExecutions.filter(e => {
        // Find executions that used this agent
        return agentMetrics.some(m => m.executionId === e.id);
      });
      
      const successful = agentExecutions.filter(e => e.status === 'success').length;
      const totalTokens = agentMetrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
      const totalCost = agentMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
      const avgTime = agentMetrics.length > 0 
        ? Math.round(agentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / agentMetrics.length) 
        : 0;
      const successRate = agentExecutions.length > 0 
        ? Math.round((successful / agentExecutions.length) * 100) 
        : 0;

      return {
        id: agent.id,
        name: agent.name,
        executions: agentExecutions.length,
        averageTime: avgTime,
        successRate,
        tokensUsed: totalTokens,
        cost: totalCost
      };
    }).sort((a, b) => b.executions - a.executions);

    // Generate optimization suggestions based on analytics
    const optimizationSuggestions = [];
    
    // Cost optimization suggestions
    if (totalCostThisMonth > 500) { // $5.00 threshold
      const highCostWorkflow = costByWorkflow[0];
      if (highCostWorkflow && highCostWorkflow.cost > 200) { // $2.00
        optimizationSuggestions.push({
          type: 'cost_optimization',
          title: 'High Cost Workflow Detected',
          description: `${highCostWorkflow.name} is consuming ${((highCostWorkflow.cost / totalCostThisMonth) * 100).toFixed(1)}% of your monthly budget. Consider optimizing token usage or model selection.`,
          priority: 'high' as const,
          potentialSavings: Math.round(highCostWorkflow.cost * 0.3) // 30% potential savings
        });
      }
    }

    // Performance optimization
    if (averageExecutionTime > 5000) { // > 5 seconds
      optimizationSuggestions.push({
        type: 'performance_optimization',
        title: 'Slow Execution Times Detected',
        description: 'Average workflow execution time is above optimal threshold. Consider implementing caching or optimizing agent prompts.',
        priority: 'medium' as const
      });
    }

    // Success rate optimization
    if (successRate < 90) {
      optimizationSuggestions.push({
        type: 'reliability_optimization',
        title: 'Success Rate Below Target',
        description: `Current success rate is ${successRate}%. Review failed executions and implement better error handling or retry logic.`,
        priority: 'high' as const
      });
    }

    // Resource utilization
    const lowPerformingAgents = agentPerformanceMetrics.filter(a => a.successRate < 80);
    if (lowPerformingAgents.length > 0) {
      optimizationSuggestions.push({
        type: 'agent_optimization',
        title: 'Agent Performance Issues',
        description: `${lowPerformingAgents.length} agent(s) have success rates below 80%. Review their configurations and training data.`,
        priority: 'medium' as const
      });
    }

    // Usage patterns analysis
    const usagePatterns = {
      peakHours: [9, 10, 11, 14, 15, 16], // Simulated peak hours based on business hours
      mostActiveWorkflows: topPerformingWorkflows.slice(0, 3).map(w => w.name),
      resourceBottlenecks: activeAlerts.filter(a => a.type.includes('high_') || a.type.includes('resource')).map(a => a.resourceType).filter((value, index, self) => self.indexOf(value) === index)
    };

    return {
      totalCostThisMonth,
      averageExecutionTime,
      successRate,
      topPerformingWorkflows,
      costByWorkflow,
      alertsSummary,
      agentPerformanceMetrics,
      optimizationSuggestions,
      usagePatterns
    };
  }
}

export const storage = new MemStorage();
