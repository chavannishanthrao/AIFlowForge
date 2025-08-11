from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# User models
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"

class User(BaseModel):
    id: str
    username: str
    email: str
    role: UserRole = UserRole.USER
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.USER

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None

# Skill models
class SkillType(str, Enum):
    DATA_EXTRACTION = "data_extraction"
    DATA_PROCESSING = "data_processing"
    COMMUNICATION = "communication"
    ANALYSIS = "analysis"
    AUTOMATION = "automation"

class Skill(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: SkillType
    config: Dict[str, Any]
    required_connectors: List[str] = []
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    type: SkillType
    config: Dict[str, Any] = {}
    required_connectors: List[str] = []
    is_active: bool = True
    created_by: Optional[str] = None

class SkillUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[SkillType] = None
    config: Optional[Dict[str, Any]] = None
    required_connectors: Optional[List[str]] = None
    is_active: Optional[bool] = None

class SkillGenerate(BaseModel):
    prompt: str = Field(..., min_length=10)
    skill_name: str = Field(..., min_length=1)

# Agent models
class MemoryPolicy(str, Enum):
    SESSION = "session"
    PERSISTENT = "persistent"
    NONE = "none"

class Agent(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    skill_ids: List[str] = []
    prompt_settings: Dict[str, Any]
    memory_policy: MemoryPolicy = MemoryPolicy.SESSION
    credentials: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    skill_ids: List[str] = []
    prompt_settings: Dict[str, Any]
    memory_policy: MemoryPolicy = MemoryPolicy.SESSION
    credentials: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_by: Optional[str] = None

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    skill_ids: Optional[List[str]] = None
    prompt_settings: Optional[Dict[str, Any]] = None
    memory_policy: Optional[MemoryPolicy] = None
    credentials: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

# Workflow models
class WorkflowNode(BaseModel):
    id: str
    type: str
    config: Dict[str, Any]

class WorkflowEdge(BaseModel):
    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    condition: Optional[str] = None

class WorkflowDefinition(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class Workflow(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    definition: WorkflowDefinition
    is_active: bool = True
    schedule: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    definition: WorkflowDefinition
    is_active: bool = True
    schedule: Optional[str] = None
    created_by: Optional[str] = None

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    definition: Optional[WorkflowDefinition] = None
    is_active: Optional[bool] = None
    schedule: Optional[str] = None

# Connector models
class ConnectorType(str, Enum):
    SALESFORCE = "salesforce"
    NETSUITE = "netsuite"
    EMAIL = "email"
    SLACK = "slack"
    ORACLE = "oracle"
    SAP = "sap"
    DYNAMICS = "dynamics"

class Connector(BaseModel):
    id: str
    name: str
    type: ConnectorType
    config: Dict[str, Any]
    credentials: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ConnectorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: ConnectorType
    config: Dict[str, Any]
    credentials: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_by: Optional[str] = None

class ConnectorUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ConnectorType] = None
    config: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

# Execution models
class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Execution(BaseModel):
    id: str
    workflow_id: str
    status: ExecutionStatus = ExecutionStatus.PENDING
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    executed_by: Optional[str] = None

class ExecutionCreate(BaseModel):
    workflow_id: str
    input: Optional[Dict[str, Any]] = None
    executed_by: Optional[str] = None

# Audit log models
class AuditLog(BaseModel):
    id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    user_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

class AuditLogCreate(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    user_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

# Document models
class Document(BaseModel):
    id: str
    title: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    embedding: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: Optional[datetime] = None

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    metadata: Optional[Dict[str, Any]] = None
    uploaded_by: Optional[str] = None

# Response models
class SkillGenerateResponse(BaseModel):
    skill: SkillCreate
    confidence: float = 0.8

class WorkflowExecuteResponse(BaseModel):
    execution_id: str
    status: ExecutionStatus
    message: str

class SystemStatusResponse(BaseModel):
    components: List[Dict[str, Any]]
    overall_health: float
