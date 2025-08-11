import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // admin, user, viewer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Skills table
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // data_extraction, data_processing, communication, analysis, automation
  config: jsonb("config").notNull(), // JSON configuration for the skill
  requiredConnectors: text("required_connectors").array().default([]),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agents table
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  skillIds: text("skill_ids").array().notNull().default([]),
  promptSettings: jsonb("prompt_settings").notNull(),
  memoryPolicy: text("memory_policy").notNull().default("session"), // session, persistent, none
  credentials: jsonb("credentials"), // encrypted credential storage
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflows table
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  definition: jsonb("definition").notNull(), // workflow graph definition
  isActive: boolean("is_active").default(true),
  schedule: text("schedule"), // cron expression for scheduled workflows
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Connectors table
export const connectors = pgTable("connectors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // salesforce, netsuite, email, etc.
  config: jsonb("config").notNull(),
  credentials: jsonb("credentials"), // encrypted OAuth tokens and credentials
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Executions table
export const executions = pgTable("executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid("workflow_id").references(() => workflows.id),
  status: text("status").notNull().default("pending"), // pending, running, success, failed, cancelled
  input: jsonb("input"),
  output: jsonb("output"),
  error: text("error"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  executedBy: uuid("executed_by").references(() => users.id),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  userId: uuid("user_id").references(() => users.id),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Documents table (for RAG/vector search)
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  embedding: text("embedding"), // vector embedding for RAG
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics tables for advanced monitoring
export const executionMetrics = pgTable("execution_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  executionId: uuid("execution_id").references(() => executions.id),
  workflowId: uuid("workflow_id").references(() => workflows.id),
  agentId: uuid("agent_id").references(() => agents.id),
  duration: integer("duration"), // execution time in milliseconds
  tokensUsed: integer("tokens_used").default(0),
  cost: integer("cost").default(0), // cost in cents
  memoryUsed: integer("memory_used").default(0), // in MB
  errorCount: integer("error_count").default(0),
  retryCount: integer("retry_count").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const performanceAlerts = pgTable("performance_alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // high_latency, high_cost, high_error_rate, resource_limit
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  message: text("message").notNull(),
  resourceType: text("resource_type").notNull(), // workflow, agent, skill
  resourceId: uuid("resource_id"),
  threshold: jsonb("threshold"), // threshold values that triggered the alert
  currentValue: jsonb("current_value"), // current metric values
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const usageStats = pgTable("usage_stats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  totalExecutions: integer("total_executions").default(0),
  successfulExecutions: integer("successful_executions").default(0),
  failedExecutions: integer("failed_executions").default(0),
  totalCost: integer("total_cost").default(0), // in cents
  totalTokens: integer("total_tokens").default(0),
  averageLatency: integer("average_latency").default(0), // in milliseconds
  peakConcurrency: integer("peak_concurrency").default(0),
  activeUsers: integer("active_users").default(0),
});

// Email Processing System for Gmail Integration & Workflow Automation
export const emailAccounts = pgTable("email_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // gmail, outlook, exchange
  credentials: jsonb("credentials").notNull(), // OAuth tokens, connection details
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailMessages = pgTable("email_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid("account_id").references(() => emailAccounts.id).notNull(),
  messageId: varchar("message_id", { length: 255 }).notNull(), // Provider message ID
  threadId: varchar("thread_id", { length: 255 }),
  from: varchar("from", { length: 255 }).notNull(),
  to: text("to").notNull(), // JSON array of recipients
  cc: text("cc"),
  bcc: text("bcc"),
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  isRead: boolean("is_read").default(false),
  hasAttachments: boolean("has_attachments").default(false),
  receivedAt: timestamp("received_at").notNull(),
  processedAt: timestamp("processed_at"),
  processingStatus: varchar("processing_status", { length: 50 }).default("pending"), // pending, processing, completed, failed
  workflowId: uuid("workflow_id").references(() => workflows.id),
  executionId: uuid("execution_id").references(() => executions.id),
  extractedData: jsonb("extracted_data"), // AI-extracted structured data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailAttachments = pgTable("email_attachments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: uuid("message_id").references(() => emailMessages.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(), // File size in bytes
  content: text("content"), // Base64 encoded content for small files
  filePath: varchar("file_path", { length: 500 }), // Path for larger files
  processedAt: timestamp("processed_at"),
  extractedData: jsonb("extracted_data"), // AI-extracted data from attachment
  processingStatus: varchar("processing_status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email Processing Rules and Triggers
export const emailRules = pgTable("email_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  accountId: uuid("account_id").references(() => emailAccounts.id).notNull(),
  conditions: jsonb("conditions").notNull(), // Match criteria (sender, subject, attachment types, etc.)
  actions: jsonb("actions").notNull(), // Workflow to trigger, data extraction rules
  workflowId: uuid("workflow_id").references(() => workflows.id),
  priority: integer("priority").default(0), // Rule execution priority
  isActive: boolean("is_active").default(true).notNull(),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConnectorSchema = createInsertSchema(connectors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExecutionSchema = createInsertSchema(executions).omit({
  id: true,
  startedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertExecutionMetricSchema = createInsertSchema(executionMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertPerformanceAlertSchema = createInsertSchema(performanceAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertUsageStatSchema = createInsertSchema(usageStats).omit({
  id: true,
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailMessageSchema = createInsertSchema(emailMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailAttachmentSchema = createInsertSchema(emailAttachments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailRuleSchema = createInsertSchema(emailRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export type InsertConnector = z.infer<typeof insertConnectorSchema>;
export type Connector = typeof connectors.$inferSelect;

export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type Execution = typeof executions.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertExecutionMetric = z.infer<typeof insertExecutionMetricSchema>;
export type ExecutionMetric = typeof executionMetrics.$inferSelect;

export type InsertPerformanceAlert = z.infer<typeof insertPerformanceAlertSchema>;
export type PerformanceAlert = typeof performanceAlerts.$inferSelect;

export type InsertUsageStat = z.infer<typeof insertUsageStatSchema>;
export type UsageStat = typeof usageStats.$inferSelect;

export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;

export type InsertEmailMessage = z.infer<typeof insertEmailMessageSchema>;
export type EmailMessage = typeof emailMessages.$inferSelect;

export type InsertEmailAttachment = z.infer<typeof insertEmailAttachmentSchema>;
export type EmailAttachment = typeof emailAttachments.$inferSelect;

export type InsertEmailRule = z.infer<typeof insertEmailRuleSchema>;
export type EmailRule = typeof emailRules.$inferSelect;
