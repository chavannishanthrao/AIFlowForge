import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertSkillSchema, insertAgentSchema, insertWorkflowSchema, insertConnectorSchema, insertDocumentSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Advanced Analytics endpoints
  app.get("/api/analytics/advanced", async (req, res) => {
    try {
      const analytics = await storage.getAdvancedAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch advanced analytics" });
    }
  });

  app.get("/api/analytics/metrics", async (req, res) => {
    try {
      const { workflowId, timeRange } = req.query;
      const metrics = await storage.getExecutionMetrics(
        workflowId as string, 
        timeRange as 'hour' | 'day' | 'week' | 'month'
      );
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch execution metrics" });
    }
  });

  app.get("/api/analytics/alerts", async (req, res) => {
    try {
      const { severity } = req.query;
      const alerts = await storage.getPerformanceAlerts(severity as string);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch performance alerts" });
    }
  });

  app.get("/api/analytics/usage-stats", async (req, res) => {
    try {
      const { timeRange } = req.query;
      const stats = await storage.getUsageStats(timeRange as 'day' | 'week' | 'month');
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch usage statistics" });
    }
  });

  // Skills routes
  app.get("/api/skills", async (req, res) => {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  app.get("/api/skills/:id", async (req, res) => {
    try {
      const skill = await storage.getSkill(req.params.id);
      if (!skill) {
        return res.status(404).json({ error: "Skill not found" });
      }
      res.json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skill" });
    }
  });

  app.post("/api/skills", async (req, res) => {
    try {
      const validatedData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(validatedData);
      
      // Log audit trail
      await storage.createAuditLog({
        action: "CREATE_SKILL",
        resourceType: "skill",
        resourceId: skill.id,
        userId: validatedData.createdBy || null,
        details: { skillName: skill.name, skillType: skill.type },
      });

      res.status(201).json(skill);
    } catch (error) {
      res.status(400).json({ error: "Invalid skill data", details: error });
    }
  });

  app.put("/api/skills/:id", async (req, res) => {
    try {
      const skill = await storage.updateSkill(req.params.id, req.body);
      if (!skill) {
        return res.status(404).json({ error: "Skill not found" });
      }
      res.json(skill);
    } catch (error) {
      res.status(400).json({ error: "Failed to update skill" });
    }
  });

  app.delete("/api/skills/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSkill(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Skill not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete skill" });
    }
  });

  // Agents routes
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const validatedData = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(validatedData);
      
      // Log audit trail
      await storage.createAuditLog({
        action: "CREATE_AGENT",
        resourceType: "agent",
        resourceId: agent.id,
        userId: validatedData.createdBy || null,
        details: { agentName: agent.name, skillCount: agent.skillIds.length },
      });

      res.status(201).json(agent);
    } catch (error) {
      res.status(400).json({ error: "Invalid agent data", details: error });
    }
  });

  app.put("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.updateAgent(req.params.id, req.body);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(400).json({ error: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAgent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });

  // Workflows routes
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validatedData);
      
      // Log audit trail
      await storage.createAuditLog({
        action: "CREATE_WORKFLOW",
        resourceType: "workflow",
        resourceId: workflow.id,
        userId: validatedData.createdBy || null,
        details: { workflowName: workflow.name, isScheduled: !!workflow.schedule },
      });

      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ error: "Invalid workflow data", details: error });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.updateWorkflow(req.params.id, req.body);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(400).json({ error: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkflow(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  // Execute workflow
  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      // Create execution record
      const execution = await storage.createExecution({
        workflowId: workflow.id,
        status: "running",
        input: req.body.input || {},
        output: null,
        error: null,
        completedAt: null,
        executedBy: req.body.userId || null,
      });

      // TODO: Implement actual workflow execution logic
      // For now, simulate success
      setTimeout(async () => {
        await storage.updateExecution(execution.id, {
          status: "success",
          output: { message: "Workflow executed successfully" },
          completedAt: new Date(),
        });
      }, 1000);

      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: "Failed to execute workflow" });
    }
  });

  // Connectors routes
  app.get("/api/connectors", async (req, res) => {
    try {
      const connectors = await storage.getConnectors();
      res.json(connectors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch connectors" });
    }
  });

  app.get("/api/connectors/:id", async (req, res) => {
    try {
      const connector = await storage.getConnector(req.params.id);
      if (!connector) {
        return res.status(404).json({ error: "Connector not found" });
      }
      res.json(connector);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch connector" });
    }
  });

  app.post("/api/connectors", async (req, res) => {
    try {
      const validatedData = insertConnectorSchema.parse(req.body);
      const connector = await storage.createConnector(validatedData);
      
      // Log audit trail
      await storage.createAuditLog({
        action: "CREATE_CONNECTOR",
        resourceType: "connector",
        resourceId: connector.id,
        userId: validatedData.createdBy || null,
        details: { connectorName: connector.name, connectorType: connector.type },
      });

      res.status(201).json(connector);
    } catch (error) {
      res.status(400).json({ error: "Invalid connector data", details: error });
    }
  });

  app.put("/api/connectors/:id", async (req, res) => {
    try {
      const connector = await storage.updateConnector(req.params.id, req.body);
      if (!connector) {
        return res.status(404).json({ error: "Connector not found" });
      }
      res.json(connector);
    } catch (error) {
      res.status(400).json({ error: "Failed to update connector" });
    }
  });

  app.delete("/api/connectors/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConnector(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Connector not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete connector" });
    }
  });

  // Executions routes
  app.get("/api/executions", async (req, res) => {
    try {
      const workflowId = req.query.workflowId as string;
      const executions = await storage.getExecutions(workflowId);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch executions" });
    }
  });

  app.get("/api/executions/:id", async (req, res) => {
    try {
      const execution = await storage.getExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch execution" });
    }
  });

  // Audit logs routes
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const logs = await storage.getAuditLogs(userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Documents routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // File upload endpoint
  app.post("/api/documents/upload", upload.array('files', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const processedDocuments = [];
      
      for (const file of files) {
        // Extract text content based on file type
        let content = "";
        
        if (file.mimetype.includes('text/plain')) {
          content = file.buffer.toString('utf-8');
        } else if (file.mimetype.includes('pdf')) {
          content = `[PDF Content] ${file.originalname}\n\nProcessed content from PDF file. In production, this would use a proper PDF parser to extract text content from: ${file.originalname}`;
        } else if (file.mimetype.includes('sheet') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.csv')) {
          content = `[Spreadsheet Content] ${file.originalname}\n\nProcessed content from spreadsheet. In production, this would parse the actual spreadsheet data and convert it to searchable text from: ${file.originalname}`;
        } else if (file.mimetype.includes('image')) {
          content = `[Image Content] ${file.originalname}\n\nProcessed OCR content from image. In production, this would use OCR technology to extract any text visible in: ${file.originalname}`;
        } else {
          content = `[Document Content] ${file.originalname}\n\nProcessed content from uploaded file.`;
        }

        // Simulate vector embedding generation
        const embedding = Array.from({length: 1536}, () => Math.random()); // OpenAI embedding size
        
        const documentData = {
          title: file.originalname,
          content: content,
          embedding: JSON.stringify(embedding),
          metadata: {
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            uploadDate: new Date().toISOString(),
            processingStatus: "processed",
            embeddingModel: "text-embedding-ada-002",
            chunkCount: Math.ceil(content.length / 1000)
          }
        };
        
        const document = await storage.createDocument(documentData);
        
        // Log audit trail
        await storage.createAuditLog({
          action: "UPLOAD_DOCUMENT",
          resourceType: "document", 
          resourceId: document.id,
          userId: "system",
          details: { 
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            contentLength: content.length
          },
        });

        processedDocuments.push(document);
      }

      res.status(201).json({ 
        success: true, 
        documents: processedDocuments,
        count: processedDocuments.length 
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: "Failed to process uploaded files", details: error });
    }
  });

  // Text document creation endpoint  
  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      
      // Generate embedding for text content
      const embedding = Array.from({length: 1536}, () => Math.random());
      
      const documentWithEmbedding = {
        title: validatedData.title,
        content: validatedData.content,
        uploadedBy: validatedData.uploadedBy,
        embedding: JSON.stringify(embedding),
        metadata: {
          ...(validatedData.metadata as any || {}),
          processingStatus: "processed",
          embeddingModel: "text-embedding-ada-002",
          chunkCount: Math.ceil(validatedData.content.length / 1000)
        }
      };
      
      const document = await storage.createDocument(documentWithEmbedding);
      
      // Log audit trail
      await storage.createAuditLog({
        action: "CREATE_DOCUMENT",
        resourceType: "document",
        resourceId: document.id,
        userId: validatedData.uploadedBy || "system",
        details: { documentTitle: document.title, contentLength: document.content.length },
      });

      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: "Invalid document data", details: error });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // AI skill generation endpoint
  app.post("/api/skills/generate", async (req, res) => {
    try {
      const { prompt, skillName } = req.body;
      
      if (!prompt || !skillName) {
        return res.status(400).json({ error: "Prompt and skill name are required" });
      }

      // TODO: Integrate with actual LLM service
      // For now, return a mock generated skill
      const generatedSkill = {
        name: skillName,
        description: `AI-generated skill based on: ${prompt}`,
        type: "data_processing",
        config: {
          inputFormat: "json",
          outputFormat: "json",
          prompt: prompt,
          model: "gpt-3.5-turbo",
          temperature: 0.7,
        },
        requiredConnectors: [],
        isActive: true,
      };

      res.json({ skill: generatedSkill });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate skill" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
