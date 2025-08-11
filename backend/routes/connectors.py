from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import uuid
from datetime import datetime

from models import Connector, ConnectorCreate, ConnectorUpdate, User
from routes.auth import get_current_user
from services.connector_service import ConnectorService

router = APIRouter()

# Mock connectors database - replace with actual database
connectors_db = {}

@router.get("/", response_model=List[Connector])
async def get_connectors(current_user: User = Depends(get_current_user)):
    """Get all connectors"""
    return list(connectors_db.values())

@router.get("/{connector_id}", response_model=Connector)
async def get_connector(connector_id: str, current_user: User = Depends(get_current_user)):
    """Get connector by ID"""
    if connector_id not in connectors_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    return connectors_db[connector_id]

@router.post("/", response_model=Connector, status_code=status.HTTP_201_CREATED)
async def create_connector(
    connector_data: ConnectorCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new connector"""
    connector_id = str(uuid.uuid4())
    
    connector = Connector(
        id=connector_id,
        name=connector_data.name,
        type=connector_data.type,
        config=connector_data.config,
        credentials=connector_data.credentials,
        is_active=connector_data.is_active,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    connectors_db[connector_id] = connector
    return connector

@router.put("/{connector_id}", response_model=Connector)
async def update_connector(
    connector_id: str,
    connector_update: ConnectorUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a connector"""
    if connector_id not in connectors_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    
    connector = connectors_db[connector_id]
    update_data = connector_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(connector, field, value)
    
    connector.updated_at = datetime.utcnow()
    connectors_db[connector_id] = connector
    
    return connector

@router.delete("/{connector_id}")
async def delete_connector(
    connector_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a connector"""
    if connector_id not in connectors_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    
    del connectors_db[connector_id]
    return {"message": "Connector deleted successfully"}

@router.post("/{connector_id}/test")
async def test_connector(
    connector_id: str,
    current_user: User = Depends(get_current_user)
):
    """Test connector connection"""
    if connector_id not in connectors_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    
    connector = connectors_db[connector_id]
    
    try:
        connector_service = ConnectorService()
        test_result = await connector_service.test_connection(connector)
        
        return {
            "connector_id": connector_id,
            "status": "success" if test_result else "failed",
            "message": "Connection test successful" if test_result else "Connection test failed",
            "tested_at": datetime.utcnow()
        }
    except Exception as e:
        return {
            "connector_id": connector_id,
            "status": "error",
            "message": f"Connection test error: {str(e)}",
            "tested_at": datetime.utcnow()
        }

@router.post("/{connector_id}/authenticate")
async def authenticate_connector(
    connector_id: str,
    auth_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Authenticate connector with OAuth or API keys"""
    if connector_id not in connectors_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    
    connector = connectors_db[connector_id]
    
    try:
        connector_service = ConnectorService()
        auth_result = await connector_service.authenticate(connector, auth_data)
        
        if auth_result:
            # Update connector with encrypted credentials
            connector.credentials = auth_result
            connector.updated_at = datetime.utcnow()
            connectors_db[connector_id] = connector
        
        return {
            "connector_id": connector_id,
            "status": "authenticated" if auth_result else "failed",
            "message": "Authentication successful" if auth_result else "Authentication failed",
            "authenticated_at": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/{connector_id}/oauth/url")
async def get_oauth_url(
    connector_id: str,
    redirect_uri: str,
    current_user: User = Depends(get_current_user)
):
    """Get OAuth authorization URL for connector"""
    if connector_id not in connectors_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    
    connector = connectors_db[connector_id]
    
    try:
        connector_service = ConnectorService()
        oauth_url = await connector_service.get_oauth_url(connector, redirect_uri)
        
        return {
            "connector_id": connector_id,
            "oauth_url": oauth_url,
            "expires_in": 600  # 10 minutes
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate OAuth URL: {str(e)}"
        )

@router.post("/{connector_id}/oauth/callback")
async def handle_oauth_callback(
    connector_id: str,
    code: str,
    state: str = None,
    current_user: User = Depends(get_current_user)
):
    """Handle OAuth callback and exchange code for tokens"""
    if connector_id not in connectors_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    
    connector = connectors_db[connector_id]
    
    try:
        connector_service = ConnectorService()
        tokens = await connector_service.handle_oauth_callback(connector, code, state)
        
        if tokens:
            # Update connector with encrypted tokens
            connector.credentials = tokens
            connector.is_active = True
            connector.updated_at = datetime.utcnow()
            connectors_db[connector_id] = connector
        
        return {
            "connector_id": connector_id,
            "status": "authenticated" if tokens else "failed",
            "message": "OAuth authentication successful" if tokens else "OAuth authentication failed"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )

@router.post("/{connector_id}/execute")
async def execute_connector_action(
    connector_id: str,
    action: str,
    parameters: dict,
    current_user: User = Depends(get_current_user)
):
    """Execute an action using the connector"""
    if connector_id not in connectors_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    
    connector = connectors_db[connector_id]
    
    if not connector.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connector is not active"
        )
    
    try:
        connector_service = ConnectorService()
        result = await connector_service.execute_action(connector, action, parameters)
        
        return {
            "connector_id": connector_id,
            "action": action,
            "status": "success",
            "result": result,
            "executed_at": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Action execution failed: {str(e)}"
        )

# Initialize with sample connectors
if not connectors_db:
    # NetSuite connector
    netsuite_connector = Connector(
        id="netsuite-connector-1",
        name="NetSuite Production",
        type="netsuite",
        config={
            "api_version": "2021.1",
            "environment": "production",
            "account_id": "PROD_ACCOUNT"
        },
        credentials={"encrypted": "encrypted_oauth_token"},
        is_active=True,
        created_by="admin-user-id",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    connectors_db[netsuite_connector.id] = netsuite_connector
    
    # Salesforce connector
    salesforce_connector = Connector(
        id="salesforce-connector-1",
        name="Salesforce CRM",
        type="salesforce",
        config={
            "api_version": "58.0",
            "sandbox": False,
            "instance_url": "https://company.my.salesforce.com"
        },
        credentials={"encrypted": "encrypted_oauth_token"},
        is_active=True,
        created_by="admin-user-id",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    connectors_db[salesforce_connector.id] = salesforce_connector
