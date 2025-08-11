from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import uuid
from datetime import datetime

from models import Agent, AgentCreate, AgentUpdate, User
from routes.auth import get_current_user

router = APIRouter()

# Mock agents database - replace with actual database
agents_db = {}

@router.get("/", response_model=List[Agent])
async def get_agents(current_user: User = Depends(get_current_user)):
    """Get all agents"""
    return list(agents_db.values())

@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str, current_user: User = Depends(get_current_user)):
    """Get agent by ID"""
    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    return agents_db[agent_id]

@router.post("/", response_model=Agent, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_data: AgentCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new agent"""
    agent_id = str(uuid.uuid4())
    
    agent = Agent(
        id=agent_id,
        name=agent_data.name,
        description=agent_data.description,
        skill_ids=agent_data.skill_ids,
        prompt_settings=agent_data.prompt_settings,
        memory_policy=agent_data.memory_policy,
        credentials=agent_data.credentials,
        is_active=agent_data.is_active,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    agents_db[agent_id] = agent
    return agent

@router.put("/{agent_id}", response_model=Agent)
async def update_agent(
    agent_id: str,
    agent_update: AgentUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an agent"""
    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    agent = agents_db[agent_id]
    update_data = agent_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(agent, field, value)
    
    agent.updated_at = datetime.utcnow()
    agents_db[agent_id] = agent
    
    return agent

@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an agent"""
    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    del agents_db[agent_id]
    return {"message": "Agent deleted successfully"}

@router.post("/{agent_id}/execute")
async def execute_agent(
    agent_id: str,
    input_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Execute an agent with given input"""
    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    agent = agents_db[agent_id]
    
    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent is not active"
        )
    
    # TODO: Implement actual agent execution logic
    # This would involve running the agent's skills in sequence
    
    execution_id = str(uuid.uuid4())
    
    return {
        "execution_id": execution_id,
        "agent_id": agent_id,
        "status": "success",
        "output": {
            "message": f"Agent {agent.name} executed successfully",
            "processed_skills": len(agent.skill_ids),
            "execution_time_ms": 250
        },
        "executed_at": datetime.utcnow()
    }

@router.get("/{agent_id}/chat")
async def chat_with_agent(
    agent_id: str,
    message: str,
    session_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Chat with an agent"""
    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    agent = agents_db[agent_id]
    
    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent is not active"
        )
    
    # TODO: Implement actual chat functionality with LLM service
    # This would use the agent's prompt settings and memory policy
    
    return {
        "agent_id": agent_id,
        "session_id": session_id or str(uuid.uuid4()),
        "response": f"Hello! I'm {agent.name}. I can help you with tasks related to my {len(agent.skill_ids)} configured skills. How can I assist you today?",
        "timestamp": datetime.utcnow()
    }

@router.get("/{agent_id}/sessions")
async def get_agent_sessions(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get chat sessions for an agent"""
    if agent_id not in agents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # TODO: Implement actual session history retrieval
    return {
        "agent_id": agent_id,
        "sessions": [
            {
                "session_id": "session-1",
                "started_at": "2023-12-01T10:00:00Z",
                "last_activity": "2023-12-01T10:15:00Z",
                "message_count": 5,
                "status": "active"
            }
        ],
        "total": 1
    }

# Initialize with sample agent
if not agents_db:
    sample_agent = Agent(
        id="sample-agent-1",
        name="Finance Agent",
        description="Processes financial documents and transactions",
        skill_ids=["sample-skill-1"],
        prompt_settings={
            "temperature": 0.2,
            "max_tokens": 1000,
            "system_prompt": "You are a finance expert assistant specialized in invoice processing and financial data analysis."
        },
        memory_policy="session",
        credentials=None,
        is_active=True,
        created_by="admin-user-id",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    agents_db[sample_agent.id] = sample_agent
