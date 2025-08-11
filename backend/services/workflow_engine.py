import asyncio
import uuid
from typing import Dict, Any, List
from datetime import datetime
from enum import Enum

from models import Workflow, WorkflowNode, Execution, ExecutionStatus

class NodeExecutor:
    """Base class for node executors"""
    
    async def execute(self, node: WorkflowNode, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a workflow node"""
        raise NotImplementedError

class TriggerExecutor(NodeExecutor):
    """Executor for trigger nodes"""
    
    async def execute(self, node: WorkflowNode, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute trigger node"""
        trigger_type = node.config.get("type", "manual")
        
        if trigger_type == "schedule":
            return {
                "trigger_type": "schedule",
                "triggered_at": datetime.utcnow().isoformat(),
                "cron": node.config.get("cron")
            }
        elif trigger_type == "webhook":
            return {
                "trigger_type": "webhook",
                "triggered_at": datetime.utcnow().isoformat(),
                "payload": input_data.get("webhook_payload", {})
            }
        else:
            return {
                "trigger_type": "manual",
                "triggered_at": datetime.utcnow().isoformat(),
                "user_input": input_data
            }

class ConnectorExecutor(NodeExecutor):
    """Executor for connector nodes"""
    
    async def execute(self, node: WorkflowNode, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute connector node"""
        connector_id = node.config.get("connector_id")
        action = node.config.get("action", "fetch")
        
        # TODO: Implement actual connector execution
        # This would use the ConnectorService to execute actions
        
        return {
            "connector_id": connector_id,
            "action": action,
            "result": {
                "records_fetched": 15,
                "data": [{"id": i, "amount": 1000 + i * 100} for i in range(15)]
            },
            "executed_at": datetime.utcnow().isoformat()
        }

class AgentExecutor(NodeExecutor):
    """Executor for agent nodes"""
    
    async def execute(self, node: WorkflowNode, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent node"""
        agent_id = node.config.get("agent_id")
        
        # TODO: Implement actual agent execution
        # This would use the LLMService and SkillService
        
        return {
            "agent_id": agent_id,
            "processed_data": input_data,
            "analysis": {
                "total_items": len(input_data.get("data", [])),
                "categorized": True,
                "anomalies_found": 2
            },
            "executed_at": datetime.utcnow().isoformat()
        }

class ActionExecutor(NodeExecutor):
    """Executor for action nodes"""
    
    async def execute(self, node: WorkflowNode, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute action node"""
        action_type = node.config.get("type", "email")
        
        if action_type == "email":
            recipient = node.config.get("recipient")
            subject = node.config.get("subject", "Workflow Result")
            
            # TODO: Implement actual email sending
            
            return {
                "action_type": "email",
                "recipient": recipient,
                "subject": subject,
                "sent": True,
                "sent_at": datetime.utcnow().isoformat()
            }
        else:
            return {
                "action_type": action_type,
                "result": "Action executed successfully",
                "executed_at": datetime.utcnow().isoformat()
            }

class ConditionExecutor(NodeExecutor):
    """Executor for condition nodes"""
    
    async def execute(self, node: WorkflowNode, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute condition node"""
        condition = node.config.get("condition", "true")
        
        # TODO: Implement proper condition evaluation
        # This would parse and evaluate the condition expression
        
        result = True  # Simplified for now
        
        return {
            "condition": condition,
            "result": result,
            "evaluated_at": datetime.utcnow().isoformat()
        }

class WorkflowEngine:
    """Main workflow execution engine"""
    
    def __init__(self):
        self.executors = {
            "trigger": TriggerExecutor(),
            "connector": ConnectorExecutor(),
            "agent": AgentExecutor(),
            "action": ActionExecutor(),
            "condition": ConditionExecutor()
        }
        self.running_executions: Dict[str, Dict] = {}
    
    async def execute_workflow(self, workflow: Workflow, input_data: Dict[str, Any]) -> str:
        """Execute a workflow and return execution ID"""
        execution_id = str(uuid.uuid4())
        
        # Create execution record
        execution = Execution(
            id=execution_id,
            workflow_id=workflow.id,
            status=ExecutionStatus.RUNNING,
            input=input_data,
            output=None,
            error=None,
            started_at=datetime.utcnow(),
            completed_at=None,
            executed_by=None
        )
        
        # Store execution state
        self.running_executions[execution_id] = {
            "execution": execution,
            "workflow": workflow,
            "current_node": None,
            "node_outputs": {},
            "completed_nodes": set()
        }
        
        # Start execution in background
        asyncio.create_task(self._execute_workflow_async(execution_id))
        
        return execution_id
    
    async def _execute_workflow_async(self, execution_id: str):
        """Execute workflow asynchronously"""
        try:
            execution_state = self.running_executions[execution_id]
            workflow = execution_state["workflow"]
            execution = execution_state["execution"]
            
            # Build execution graph
            nodes_by_id = {node.id: node for node in workflow.definition.nodes}
            edges_by_from = {}
            
            for edge in workflow.definition.edges:
                if edge.from_node not in edges_by_from:
                    edges_by_from[edge.from_node] = []
                edges_by_from[edge.from_node].append(edge)
            
            # Find entry points (nodes with no incoming edges)
            incoming_edges = set(edge.to_node for edge in workflow.definition.edges)
            entry_nodes = [node.id for node in workflow.definition.nodes if node.id not in incoming_edges]
            
            # Execute nodes in topological order
            execution_queue = entry_nodes.copy()
            completed_nodes = set()
            node_outputs = {}
            
            while execution_queue:
                current_node_id = execution_queue.pop(0)
                
                if current_node_id in completed_nodes:
                    continue
                
                # Check if all dependencies are satisfied
                dependencies = [edge.from_node for edge in workflow.definition.edges if edge.to_node == current_node_id]
                if not all(dep in completed_nodes for dep in dependencies):
                    # Re-queue for later
                    execution_queue.append(current_node_id)
                    continue
                
                node = nodes_by_id[current_node_id]
                execution_state["current_node"] = current_node_id
                
                # Prepare input data for this node
                node_input = execution.input.copy()
                for dep in dependencies:
                    if dep in node_outputs:
                        node_input.update(node_outputs[dep])
                
                # Execute the node
                executor = self.executors.get(node.type)
                if not executor:
                    raise Exception(f"No executor found for node type: {node.type}")
                
                output = await executor.execute(node, node_input)
                node_outputs[current_node_id] = output
                completed_nodes.add(current_node_id)
                
                # Add next nodes to queue
                if current_node_id in edges_by_from:
                    for edge in edges_by_from[current_node_id]:
                        # TODO: Evaluate edge conditions
                        execution_queue.append(edge.to_node)
            
            # Update execution with success
            execution.status = ExecutionStatus.SUCCESS
            execution.output = {
                "node_outputs": node_outputs,
                "completed_nodes": list(completed_nodes),
                "execution_summary": "Workflow completed successfully"
            }
            execution.completed_at = datetime.utcnow()
            
        except Exception as e:
            # Update execution with error
            execution.status = ExecutionStatus.FAILED
            execution.error = str(e)
            execution.completed_at = datetime.utcnow()
        
        finally:
            # Clean up execution state
            execution_state["execution"] = execution
            # In a real implementation, this would be persisted to database
    
    async def get_execution_status(self, execution_id: str) -> Dict[str, Any]:
        """Get current status of an execution"""
        if execution_id not in self.running_executions:
            return {"error": "Execution not found"}
        
        execution_state = self.running_executions[execution_id]
        execution = execution_state["execution"]
        
        return {
            "execution_id": execution_id,
            "status": execution.status,
            "current_node": execution_state.get("current_node"),
            "completed_nodes": list(execution_state.get("completed_nodes", set())),
            "started_at": execution.started_at.isoformat() if execution.started_at else None,
            "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
            "error": execution.error
        }
    
    async def cancel_execution(self, execution_id: str) -> bool:
        """Cancel a running execution"""
        if execution_id not in self.running_executions:
            return False
        
        execution_state = self.running_executions[execution_id]
        execution = execution_state["execution"]
        
        if execution.status in [ExecutionStatus.SUCCESS, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED]:
            return False
        
        execution.status = ExecutionStatus.CANCELLED
        execution.completed_at = datetime.utcnow()
        execution.error = "Execution cancelled by user"
        
        return True
    
    def get_running_executions(self) -> List[str]:
        """Get list of currently running execution IDs"""
        return [
            exec_id for exec_id, state in self.running_executions.items()
            if state["execution"].status == ExecutionStatus.RUNNING
        ]
