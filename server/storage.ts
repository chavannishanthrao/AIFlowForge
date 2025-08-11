import { 
  type User, type InsertUser, type Skill, type InsertSkill,
  type Agent, type InsertAgent, type Workflow, type InsertWorkflow,
  type Connector, type InsertConnector, type Execution, type InsertExecution,
  type AuditLog, type InsertAuditLog, type Document, type InsertDocument
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
}

export const storage = new MemStorage();
