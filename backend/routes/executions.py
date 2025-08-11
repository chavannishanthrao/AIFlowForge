from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
import uuid
from datetime import datetime

from models import Execution, ExecutionCreate, User
from routes.auth import get_current_user

router = APIRouter()

# Mock executions database - replace with actual database
executions_db = {}

@router.get("/", response_model=List[Execution])
async def get_executions(
    workflow_id: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get executions, optionally filtered by workflow"""
    executions = list(executions_db.values())
    
    if workflow_id:
        executions = [e for e in executions if e.workflow_id == workflow_id]
    
    # Sort by start time, most recent first
    executions.sort(key=lambda x: x.started_at or datetime.min, reverse=True)
    
    return executions[:limit]

@router.get("/{execution_id}", response_model=Execution)
async def get_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get execution by ID"""
    if execution_id not in executions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    return executions_db[execution_id]

@router.post("/", response_model=Execution, status_code=status.HTTP_201_CREATED)
async def create_execution(
    execution_data: ExecutionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new execution"""
    execution_id = str(uuid.uuid4())
    
    execution = Execution(
        id=execution_id,
        workflow_id=execution_data.workflow_id,
        status="pending",
        input=execution_data.input,
        output=None,
        error=None,
        started_at=datetime.utcnow(),
        completed_at=None,
        executed_by=execution_data.executed_by or current_user.id
    )
    
    executions_db[execution_id] = execution
    return execution

@router.put("/{execution_id}/status")
async def update_execution_status(
    execution_id: str,
    status: str,
    output: Optional[dict] = None,
    error: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Update execution status and results"""
    if execution_id not in executions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    execution = executions_db[execution_id]
    execution.status = status
    
    if output:
        execution.output = output
    
    if error:
        execution.error = error
    
    if status in ["success", "failed", "cancelled"]:
        execution.completed_at = datetime.utcnow()
    
    executions_db[execution_id] = execution
    return execution

@router.post("/{execution_id}/cancel")
async def cancel_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a running execution"""
    if execution_id not in executions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    execution = executions_db[execution_id]
    
    if execution.status not in ["pending", "running"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel execution that is not pending or running"
        )
    
    execution.status = "cancelled"
    execution.completed_at = datetime.utcnow()
    execution.error = "Execution cancelled by user"
    
    executions_db[execution_id] = execution
    
    return {
        "execution_id": execution_id,
        "status": "cancelled",
        "message": "Execution cancelled successfully"
    }

@router.get("/{execution_id}/logs")
async def get_execution_logs(
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed logs for an execution"""
    if execution_id not in executions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    # TODO: Implement actual log retrieval
    return {
        "execution_id": execution_id,
        "logs": [
            {
                "timestamp": "2023-12-01T10:00:00Z",
                "level": "INFO",
                "message": "Workflow execution started",
                "node_id": "trigger"
            },
            {
                "timestamp": "2023-12-01T10:00:05Z",
                "level": "INFO",
                "message": "Connecting to NetSuite",
                "node_id": "netsuite"
            },
            {
                "timestamp": "2023-12-01T10:00:30Z",
                "level": "INFO",
                "message": "Retrieved 15 pending invoices",
                "node_id": "netsuite"
            },
            {
                "timestamp": "2023-12-01T10:01:00Z",
                "level": "INFO",
                "message": "Processing invoices with Finance Agent",
                "node_id": "agent"
            },
            {
                "timestamp": "2023-12-01T10:02:00Z",
                "level": "INFO",
                "message": "Sending email report",
                "node_id": "email"
            },
            {
                "timestamp": "2023-12-01T10:02:30Z",
                "level": "INFO",
                "message": "Workflow execution completed successfully",
                "node_id": "end"
            }
        ]
    }

@router.get("/{execution_id}/steps")
async def get_execution_steps(
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get step-by-step execution details"""
    if execution_id not in executions_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    # TODO: Implement actual step tracking
    return {
        "execution_id": execution_id,
        "steps": [
            {
                "node_id": "trigger",
                "status": "success",
                "started_at": "2023-12-01T10:00:00Z",
                "completed_at": "2023-12-01T10:00:01Z",
                "duration_ms": 1000,
                "input": {"trigger_type": "schedule"},
                "output": {"trigger_fired": True}
            },
            {
                "node_id": "netsuite",
                "status": "success",
                "started_at": "2023-12-01T10:00:05Z",
                "completed_at": "2023-12-01T10:00:30Z",
                "duration_ms": 25000,
                "input": {},
                "output": {"invoices": 15, "total_amount": 125000}
            },
            {
                "node_id": "agent",
                "status": "success",
                "started_at": "2023-12-01T10:01:00Z",
                "completed_at": "2023-12-01T10:02:00Z",
                "duration_ms": 60000,
                "input": {"invoices": 15},
                "output": {"processed_invoices": 15, "categorized": 15, "flagged": 2}
            },
            {
                "node_id": "email",
                "status": "success",
                "started_at": "2023-12-01T10:02:00Z",
                "completed_at": "2023-12-01T10:02:30Z",
                "duration_ms": 30000,
                "input": {"report_data": {"invoices": 15, "total": 125000}},
                "output": {"email_sent": True, "recipient": "cfo@company.com"}
            }
        ]
    }

@router.get("/stats/summary")
async def get_execution_stats(
    current_user: User = Depends(get_current_user)
):
    """Get execution statistics summary"""
    executions = list(executions_db.values())
    
    stats = {
        "total_executions": len(executions),
        "successful_executions": len([e for e in executions if e.status == "success"]),
        "failed_executions": len([e for e in executions if e.status == "failed"]),
        "running_executions": len([e for e in executions if e.status == "running"]),
        "cancelled_executions": len([e for e in executions if e.status == "cancelled"]),
    }
    
    if stats["total_executions"] > 0:
        stats["success_rate"] = round(stats["successful_executions"] / stats["total_executions"] * 100, 2)
    else:
        stats["success_rate"] = 0.0
    
    return stats

# Initialize with sample execution
if not executions_db:
    sample_execution = Execution(
        id="sample-execution-1",
        workflow_id="sample-workflow-1",
        status="success",
        input={"trigger_type": "schedule"},
        output={"processed_invoices": 15, "email_sent": True},
        error=None,
        started_at=datetime.utcnow().replace(hour=10, minute=0, second=0),
        completed_at=datetime.utcnow().replace(hour=10, minute=2, second=30),
        executed_by="admin-user-id"
    )
    executions_db[sample_execution.id] = sample_execution
