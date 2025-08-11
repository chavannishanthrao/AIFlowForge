import { apiRequest } from "./queryClient";

// API client for making requests to the backend
export const api = {
  // Dashboard
  getDashboardStats: () => apiRequest("GET", "/api/dashboard/stats"),

  // Skills
  getSkills: () => apiRequest("GET", "/api/skills"),
  getSkill: (id: string) => apiRequest("GET", `/api/skills/${id}`),
  createSkill: (data: any) => apiRequest("POST", "/api/skills", data),
  updateSkill: (id: string, data: any) => apiRequest("PUT", `/api/skills/${id}`, data),
  deleteSkill: (id: string) => apiRequest("DELETE", `/api/skills/${id}`),
  generateSkill: (data: { prompt: string; skillName: string }) => 
    apiRequest("POST", "/api/skills/generate", data),

  // Agents
  getAgents: () => apiRequest("GET", "/api/agents"),
  getAgent: (id: string) => apiRequest("GET", `/api/agents/${id}`),
  createAgent: (data: any) => apiRequest("POST", "/api/agents", data),
  updateAgent: (id: string, data: any) => apiRequest("PUT", `/api/agents/${id}`, data),
  deleteAgent: (id: string) => apiRequest("DELETE", `/api/agents/${id}`),

  // Workflows
  getWorkflows: () => apiRequest("GET", "/api/workflows"),
  getWorkflow: (id: string) => apiRequest("GET", `/api/workflows/${id}`),
  createWorkflow: (data: any) => apiRequest("POST", "/api/workflows", data),
  updateWorkflow: (id: string, data: any) => apiRequest("PUT", `/api/workflows/${id}`, data),
  deleteWorkflow: (id: string) => apiRequest("DELETE", `/api/workflows/${id}`),
  executeWorkflow: (id: string, input?: any) => 
    apiRequest("POST", `/api/workflows/${id}/execute`, { input }),

  // Connectors
  getConnectors: () => apiRequest("GET", "/api/connectors"),
  getConnector: (id: string) => apiRequest("GET", `/api/connectors/${id}`),
  createConnector: (data: any) => apiRequest("POST", "/api/connectors", data),
  updateConnector: (id: string, data: any) => apiRequest("PUT", `/api/connectors/${id}`, data),
  deleteConnector: (id: string) => apiRequest("DELETE", `/api/connectors/${id}`),

  // Executions
  getExecutions: (workflowId?: string) => 
    apiRequest("GET", `/api/executions${workflowId ? `?workflowId=${workflowId}` : ""}`),
  getExecution: (id: string) => apiRequest("GET", `/api/executions/${id}`),

  // Audit Logs
  getAuditLogs: (userId?: string) => 
    apiRequest("GET", `/api/audit-logs${userId ? `?userId=${userId}` : ""}`),

  // Documents
  getDocuments: () => apiRequest("GET", "/api/documents"),
  uploadDocument: (data: FormData) => apiRequest("POST", "/api/documents", data),
  deleteDocument: (id: string) => apiRequest("DELETE", `/api/documents/${id}`),

  // Authentication
  login: (credentials: { username: string; password: string }) => 
    apiRequest("POST", "/api/auth/login", credentials),
  logout: () => apiRequest("POST", "/api/auth/logout"),
  getCurrentUser: () => apiRequest("GET", "/api/auth/me"),
};

// Helper functions for common API patterns
export const createMutationFn = <T = any>(apiCall: () => Promise<Response>) => {
  return async (): Promise<T> => {
    const response = await apiCall();
    return response.json();
  };
};

export const createQueryFn = <T = any>(apiCall: () => Promise<Response>) => {
  return async (): Promise<T> => {
    const response = await apiCall();
    return response.json();
  };
};
