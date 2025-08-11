from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import os
from pathlib import Path

from config import settings
from database import init_db
from routes import auth, skills, agents, workflows, connectors, executions
from models import User

# Initialize FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="AI Orchestration Platform",
    description="Enterprise AI orchestration platform for Skills, Agents, and Workflows",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user from token"""
    # TODO: Implement JWT token validation
    # For now, return a mock admin user
    return User(
        id="admin-user-id",
        username="admin",
        email="admin@example.com",
        role="admin",
        created_at=None,
        updated_at=None
    )

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(skills.router, prefix="/api/skills", tags=["skills"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(connectors.router, prefix="/api/connectors", tags=["connectors"])
app.include_router(executions.router, prefix="/api/executions", tags=["executions"])

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Dashboard stats endpoint
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics"""
    # TODO: Implement actual statistics calculation
    return {
        "activeWorkflows": 24,
        "skills": 142,
        "successfulExecutions": 1847,
        "connectedSystems": 8
    }

# System status endpoint
@app.get("/api/system/status")
async def get_system_status(current_user: User = Depends(get_current_user)):
    """Get system component status"""
    return {
        "components": [
            {
                "name": "API Gateway",
                "status": "operational",
                "description": "Operational"
            },
            {
                "name": "Workflow Engine",
                "status": "operational",
                "description": "Operational"
            },
            {
                "name": "Vector Database",
                "status": "warning",
                "description": "High Load"
            },
            {
                "name": "Queue System",
                "status": "operational",
                "description": "Operational"
            }
        ],
        "overallHealth": 98.2
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4
    )
