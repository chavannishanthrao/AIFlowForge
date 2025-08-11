from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import uuid
from datetime import datetime

from models import Workflow, WorkflowCreate, WorkflowUpdate, User, WorkflowExecuteResponse
from routes.auth import get_current_user
from services.workflow_engine import WorkflowEngine

router = APIRouter()

# Mock workflows database - replace with actual database
workflows_db = {}

@router.get("/", response_model=List[Workflow])
async def get_workflows(current_user: User = Depends(get_current_user)):
    """Get all workflows"""
    return list(workflows_db.values())

@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    """Get workflow by ID"""
    if workflow_id not in workflows_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    return workflows_db[workflow_id]

@router.post("/", response_model=Workflow, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow"""
    workflow_id = str(uuid.uuid4())
    
    workflow = Workflow(
        id=workflow_id,
        name=workflow_data.name,
        description=workflow_data.description,
        definition=workflow_data.definition,
        is_active=workflow_data.is_active,
        schedule=workflow_data.schedule,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    workflows_db[workflow_id] = workflow
    return workflow

@router.put("/{workflow_id}", response_model=Workflow)
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    workflow = workflows_db[workflow_id]
    update_data = workflow_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(workflow, field, value)
    
    workflow.updated_at = datetime.utcnow()
    workflows_db[workflow_id] = workflow
    
    return workflow

@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    del workflows_db[workflow_id]
    return {"message": "Workflow deleted successfully"}

@router.post("/{workflow_id}/execute", response_model=WorkflowExecuteResponse)
async def execute_workflow(
    workflow_id: str,
    input_data: dict = None,
    current_user: User = Depends(get_current_user)
):
    """Execute a workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    workflow = workflows_db[workflow_id]
    
    if not workflow.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow is not active"
        )
    
    try:
        # Initialize workflow engine
        engine = WorkflowEngine()
        execution_id = await engine.execute_workflow(workflow, input_data or {})
        
        return WorkflowExecuteResponse(
            execution_id=execution_id,
            status="running",
            message="Workflow execution started successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute workflow: {str(e)}"
        )

@router.post("/{workflow_id}/validate")
async def validate_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Validate a workflow definition"""
    if workflow_id not in workflows_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    workflow = workflows_db[workflow_id]
    
    # TODO: Implement workflow validation logic
    # Check for circular dependencies, missing nodes, etc.
    
    validation_results = {
        "workflow_id": workflow_id,
        "is_valid": True,
        "errors": [],
        "warnings": [],
        "node_count": len(workflow.definition.nodes),
        "edge_count": len(workflow.definition.edges)
    }
    
    return validation_results

@router.get("/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get execution history for a workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # TODO: Implement actual execution history retrieval
    return {
        "workflow_id": workflow_id,
        "executions": [
            {
                "id": "exec-1",
                "status": "success",
                "started_at": "2023-12-01T10:00:00Z",
                "completed_at": "2023-12-01T10:02:30Z",
                "execution_time_ms": 150000,
                "triggered_by": "schedule"
            }
        ],
        "total": 1,
        "limit": limit
    }

@router.post("/{workflow_id}/schedule")
async def schedule_workflow(
    workflow_id: str,
    cron_expression: str,
    current_user: User = Depends(get_current_user)
):
    """Schedule a workflow to run automatically"""
    if workflow_id not in workflows_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    workflow = workflows_db[workflow_id]
    workflow.schedule = cron_expression
    workflow.updated_at = datetime.utcnow()
    
    # TODO: Register with scheduler service
    
    return {
        "workflow_id": workflow_id,
        "schedule": cron_expression,
        "status": "scheduled",
        "message": "Workflow scheduled successfully"
    }

@router.delete("/{workflow_id}/schedule")
async def unschedule_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove scheduling from a workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    workflow = workflows_db[workflow_id]
    workflow.schedule = None
    workflow.updated_at = datetime.utcnow()
    
    # TODO: Unregister from scheduler service
    
    return {
        "workflow_id": workflow_id,
        "status": "unscheduled",
        "message": "Workflow schedule removed successfully"
    }

# Initialize with sample workflow
if not workflows_db:
    from models import WorkflowDefinition, WorkflowNode, WorkflowEdge
    
    sample_workflow = Workflow(
        id="sample-workflow-1",
        name="Invoice Processing - Weekly",
        description="Automated weekly invoice processing workflow",
        definition=WorkflowDefinition(
            nodes=[
                WorkflowNode(id="trigger", type="schedule", config={"cron": "0 9 * * 1"}),
                WorkflowNode(id="netsuite", type="connector", config={"connector_id": "netsuite-1"}),
                WorkflowNode(id="agent", type="agent", config={"agent_id": "sample-agent-1"}),
                WorkflowNode(id="email", type="action", config={"recipient": "cfo@company.com"})
            ],
            edges=[
                WorkflowEdge(from_node="trigger", to_node="netsuite"),
                WorkflowEdge(from_node="netsuite", to_node="agent"),
                WorkflowEdge(from_node="agent", to_node="email")
            ]
        ),
        is_active=True,
        schedule="0 9 * * 1",  # Every Monday at 9 AM
        created_by="admin-user-id",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    workflows_db[sample_workflow.id] = sample_workflow
