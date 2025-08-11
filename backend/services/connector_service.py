import asyncio
import aiohttp
import json
import base64
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from urllib.parse import urlencode
from cryptography.fernet import Fernet

from models import Connector, ConnectorType
from config import settings

class ConnectorCredentials:
    """Handle encrypted credential storage"""
    
    def __init__(self, encryption_key: Optional[str] = None):
        self.encryption_key = encryption_key or settings.ENCRYPTION_KEY
        if self.encryption_key:
            self.cipher = Fernet(self.encryption_key.encode())
        else:
            # Generate a key for development
            self.cipher = Fernet(Fernet.generate_key())
    
    def encrypt_credentials(self, credentials: Dict[str, Any]) -> str:
        """Encrypt credentials for storage"""
        credentials_json = json.dumps(credentials)
        encrypted = self.cipher.encrypt(credentials_json.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt_credentials(self, encrypted_credentials: str) -> Dict[str, Any]:
        """Decrypt credentials for use"""
        try:
            encrypted_data = base64.b64decode(encrypted_credentials.encode())
            decrypted = self.cipher.decrypt(encrypted_data)
            return json.loads(decrypted.decode())
        except Exception as e:
            raise Exception(f"Failed to decrypt credentials: {str(e)}")

class BaseConnector:
    """Base class for all connectors"""
    
    def __init__(self, connector: Connector, credentials_manager: ConnectorCredentials):
        self.connector = connector
        self.credentials_manager = credentials_manager
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def close(self):
        """Close HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    def get_credentials(self) -> Dict[str, Any]:
        """Get decrypted credentials"""
        if not self.connector.credentials:
            return {}
        
        encrypted_creds = self.connector.credentials.get("encrypted", "")
        if encrypted_creds:
            return self.credentials_manager.decrypt_credentials(encrypted_creds)
        return {}
    
    async def test_connection(self) -> bool:
        """Test if the connector can connect successfully"""
        raise NotImplementedError
    
    async def authenticate(self, auth_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Authenticate and store credentials"""
        raise NotImplementedError
    
    async def execute_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific action"""
        raise NotImplementedError

class SalesforceConnector(BaseConnector):
    """Salesforce CRM connector"""
    
    def __init__(self, connector: Connector, credentials_manager: ConnectorCredentials):
        super().__init__(connector, credentials_manager)
        self.api_version = connector.config.get("api_version", "58.0")
        self.sandbox = connector.config.get("sandbox", False)
        self.base_url = self._get_base_url()
    
    def _get_base_url(self) -> str:
        """Get Salesforce base URL"""
        if self.sandbox:
            return "https://test.salesforce.com"
        return "https://login.salesforce.com"
    
    async def test_connection(self) -> bool:
        """Test Salesforce connection"""
        try:
            credentials = self.get_credentials()
            if not credentials.get("access_token"):
                return False
            
            session = await self._get_session()
            headers = {
                "Authorization": f"Bearer {credentials['access_token']}",
                "Content-Type": "application/json"
            }
            
            instance_url = credentials.get("instance_url", self.base_url)
            url = f"{instance_url}/services/data/v{self.api_version}/sobjects/"
            
            async with session.get(url, headers=headers) as response:
                return response.status == 200
        except Exception:
            return False
    
    async def authenticate(self, auth_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Authenticate with Salesforce OAuth"""
        try:
            session = await self._get_session()
            
            # Exchange authorization code for access token
            token_data = {
                "grant_type": "authorization_code",
                "client_id": auth_data.get("client_id") or settings.SALESFORCE_CLIENT_ID,
                "client_secret": auth_data.get("client_secret") or settings.SALESFORCE_CLIENT_SECRET,
                "code": auth_data["code"],
                "redirect_uri": auth_data.get("redirect_uri")
            }
            
            url = f"{self.base_url}/services/oauth2/token"
            
            async with session.post(url, data=token_data) as response:
                if response.status == 200:
                    token_response = await response.json()
                    
                    credentials = {
                        "access_token": token_response["access_token"],
                        "refresh_token": token_response.get("refresh_token"),
                        "instance_url": token_response["instance_url"],
                        "token_type": token_response.get("token_type", "Bearer"),
                        "expires_at": datetime.utcnow() + timedelta(seconds=token_response.get("expires_in", 3600))
                    }
                    
                    encrypted_creds = self.credentials_manager.encrypt_credentials(credentials)
                    return {"encrypted": encrypted_creds}
                
                return None
        except Exception as e:
            raise Exception(f"Salesforce authentication failed: {str(e)}")
    
    async def execute_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Salesforce action"""
        credentials = self.get_credentials()
        if not credentials.get("access_token"):
            raise Exception("No valid access token available")
        
        session = await self._get_session()
        headers = {
            "Authorization": f"Bearer {credentials['access_token']}",
            "Content-Type": "application/json"
        }
        
        instance_url = credentials["instance_url"]
        
        if action == "query":
            soql = parameters.get("soql")
            if not soql:
                raise Exception("SOQL query required")
            
            url = f"{instance_url}/services/data/v{self.api_version}/query/"
            params = {"q": soql}
            
            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"Query failed: {response.status}")
        
        elif action == "create":
            sobject = parameters.get("sobject")
            data = parameters.get("data")
            
            if not sobject or not data:
                raise Exception("SObject type and data required")
            
            url = f"{instance_url}/services/data/v{self.api_version}/sobjects/{sobject}/"
            
            async with session.post(url, headers=headers, json=data) as response:
                if response.status in [200, 201]:
                    return await response.json()
                else:
                    raise Exception(f"Create failed: {response.status}")
        
        elif action == "update":
            sobject = parameters.get("sobject")
            record_id = parameters.get("id")
            data = parameters.get("data")
            
            if not all([sobject, record_id, data]):
                raise Exception("SObject type, record ID, and data required")
            
            url = f"{instance_url}/services/data/v{self.api_version}/sobjects/{sobject}/{record_id}"
            
            async with session.patch(url, headers=headers, json=data) as response:
                if response.status == 204:
                    return {"success": True}
                else:
                    raise Exception(f"Update failed: {response.status}")
        
        else:
            raise Exception(f"Unknown action: {action}")

class NetSuiteConnector(BaseConnector):
    """NetSuite ERP connector"""
    
    def __init__(self, connector: Connector, credentials_manager: ConnectorCredentials):
        super().__init__(connector, credentials_manager)
        self.account_id = connector.config.get("account_id")
        self.api_version = connector.config.get("api_version", "2021.1")
        self.base_url = f"https://{self.account_id}.suitetalk.api.netsuite.com"
    
    async def test_connection(self) -> bool:
        """Test NetSuite connection"""
        try:
            credentials = self.get_credentials()
            if not all([credentials.get("consumer_key"), credentials.get("access_token")]):
                return False
            
            session = await self._get_session()
            headers = self._get_auth_headers("GET", "/services/rest/query/v1/suiteql")
            
            url = f"{self.base_url}/services/rest/query/v1/suiteql"
            params = {"q": "SELECT id FROM customer FETCH FIRST 1 ROWS ONLY"}
            
            async with session.get(url, headers=headers, params=params) as response:
                return response.status == 200
        except Exception:
            return False
    
    def _get_auth_headers(self, method: str, path: str) -> Dict[str, str]:
        """Generate OAuth 1.0a headers for NetSuite"""
        # TODO: Implement proper OAuth 1.0a signature generation
        # This is a simplified version - use a proper OAuth library in production
        
        credentials = self.get_credentials()
        
        return {
            "Authorization": f"OAuth oauth_consumer_key=\"{credentials.get('consumer_key')}\", "
                           f"oauth_token=\"{credentials.get('access_token')}\", "
                           f"oauth_signature_method=\"HMAC-SHA256\", "
                           f"oauth_timestamp=\"{int(datetime.utcnow().timestamp())}\", "
                           f"oauth_nonce=\"{datetime.utcnow().microsecond}\", "
                           f"oauth_version=\"1.0\"",
            "Content-Type": "application/json"
        }
    
    async def authenticate(self, auth_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Authenticate with NetSuite Token-Based Authentication"""
        try:
            # NetSuite uses Token-Based Authentication (TBA)
            credentials = {
                "consumer_key": auth_data["consumer_key"],
                "consumer_secret": auth_data["consumer_secret"],
                "access_token": auth_data["access_token"],
                "access_token_secret": auth_data["access_token_secret"]
            }
            
            encrypted_creds = self.credentials_manager.encrypt_credentials(credentials)
            return {"encrypted": encrypted_creds}
        except Exception as e:
            raise Exception(f"NetSuite authentication failed: {str(e)}")
    
    async def execute_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute NetSuite action"""
        credentials = self.get_credentials()
        if not credentials.get("access_token"):
            raise Exception("No valid access token available")
        
        session = await self._get_session()
        
        if action == "suiteql":
            query = parameters.get("query")
            if not query:
                raise Exception("SuiteQL query required")
            
            headers = self._get_auth_headers("GET", "/services/rest/query/v1/suiteql")
            url = f"{self.base_url}/services/rest/query/v1/suiteql"
            params = {"q": query}
            
            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"SuiteQL query failed: {response.status}")
        
        elif action == "restlet":
            script_id = parameters.get("script_id")
            deploy_id = parameters.get("deploy_id")
            data = parameters.get("data", {})
            
            if not all([script_id, deploy_id]):
                raise Exception("Script ID and Deploy ID required")
            
            headers = self._get_auth_headers("POST", f"/services/rest/restlet/{script_id}/{deploy_id}")
            url = f"{self.base_url}/services/rest/restlet/{script_id}/{deploy_id}"
            
            async with session.post(url, headers=headers, json=data) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"RESTlet execution failed: {response.status}")
        
        else:
            raise Exception(f"Unknown action: {action}")

class EmailConnector(BaseConnector):
    """Email connector using SMTP"""
    
    def __init__(self, connector: Connector, credentials_manager: ConnectorCredentials):
        super().__init__(connector, credentials_manager)
        self.smtp_server = connector.config.get("smtp_server", "smtp.gmail.com")
        self.smtp_port = connector.config.get("smtp_port", 587)
        self.use_tls = connector.config.get("use_tls", True)
    
    async def test_connection(self) -> bool:
        """Test email connection"""
        try:
            import aiosmtplib
            
            credentials = self.get_credentials()
            username = credentials.get("username")
            password = credentials.get("password")
            
            if not all([username, password]):
                return False
            
            await aiosmtplib.connect(
                hostname=self.smtp_server,
                port=self.smtp_port,
                username=username,
                password=password,
                use_tls=self.use_tls
            )
            return True
        except Exception:
            return False
    
    async def authenticate(self, auth_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Store email credentials"""
        try:
            credentials = {
                "username": auth_data["username"],
                "password": auth_data["password"]
            }
            
            encrypted_creds = self.credentials_manager.encrypt_credentials(credentials)
            return {"encrypted": encrypted_creds}
        except Exception as e:
            raise Exception(f"Email authentication failed: {str(e)}")
    
    async def execute_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute email action"""
        if action == "send":
            import aiosmtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            credentials = self.get_credentials()
            
            to_emails = parameters.get("to", [])
            if isinstance(to_emails, str):
                to_emails = [to_emails]
            
            subject = parameters.get("subject", "")
            body = parameters.get("body", "")
            from_email = parameters.get("from", credentials.get("username"))
            
            # Create message
            msg = MIMEMultipart()
            msg["From"] = from_email
            msg["To"] = ", ".join(to_emails)
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))
            
            # Send email
            await aiosmtplib.send(
                msg,
                hostname=self.smtp_server,
                port=self.smtp_port,
                username=credentials["username"],
                password=credentials["password"],
                use_tls=self.use_tls
            )
            
            return {
                "success": True,
                "message": "Email sent successfully",
                "recipients": to_emails,
                "sent_at": datetime.utcnow().isoformat()
            }
        
        else:
            raise Exception(f"Unknown email action: {action}")

class ConnectorService:
    """Main connector service"""
    
    def __init__(self):
        self.credentials_manager = ConnectorCredentials()
        self.connectors: Dict[str, BaseConnector] = {}
    
    def _create_connector(self, connector: Connector) -> BaseConnector:
        """Create appropriate connector instance"""
        if connector.type == ConnectorType.SALESFORCE:
            return SalesforceConnector(connector, self.credentials_manager)
        elif connector.type == ConnectorType.NETSUITE:
            return NetSuiteConnector(connector, self.credentials_manager)
        elif connector.type == ConnectorType.EMAIL:
            return EmailConnector(connector, self.credentials_manager)
        else:
            raise ValueError(f"Unknown connector type: {connector.type}")
    
    async def test_connection(self, connector: Connector) -> bool:
        """Test connector connection"""
        try:
            conn = self._create_connector(connector)
            result = await conn.test_connection()
            await conn.close()
            return result
        except Exception:
            return False
    
    async def authenticate(self, connector: Connector, auth_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Authenticate connector"""
        conn = self._create_connector(connector)
        try:
            result = await conn.authenticate(auth_data)
            return result
        finally:
            await conn.close()
    
    async def execute_action(self, connector: Connector, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute connector action"""
        conn = self._create_connector(connector)
        try:
            result = await conn.execute_action(action, parameters)
            return result
        finally:
            await conn.close()
    
    async def get_oauth_url(self, connector: Connector, redirect_uri: str) -> str:
        """Generate OAuth authorization URL"""
        if connector.type == ConnectorType.SALESFORCE:
            params = {
                "response_type": "code",
                "client_id": settings.SALESFORCE_CLIENT_ID,
                "redirect_uri": redirect_uri,
                "scope": "full refresh_token"
            }
            
            base_url = "https://test.salesforce.com" if connector.config.get("sandbox") else "https://login.salesforce.com"
            return f"{base_url}/services/oauth2/authorize?" + urlencode(params)
        
        else:
            raise Exception(f"OAuth not supported for connector type: {connector.type}")
    
    async def handle_oauth_callback(self, connector: Connector, code: str, state: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Handle OAuth callback"""
        if connector.type == ConnectorType.SALESFORCE:
            conn = SalesforceConnector(connector, self.credentials_manager)
            try:
                auth_data = {
                    "code": code,
                    "redirect_uri": state  # State contains redirect_uri for Salesforce
                }
                return await conn.authenticate(auth_data)
            finally:
                await conn.close()
        
        else:
            raise Exception(f"OAuth callback not supported for connector type: {connector.type}")
    
    async def refresh_token(self, connector: Connector) -> bool:
        """Refresh access token if supported"""
        if connector.type == ConnectorType.SALESFORCE:
            try:
                credentials = self.credentials_manager.decrypt_credentials(
                    connector.credentials.get("encrypted", "")
                )
                
                if not credentials.get("refresh_token"):
                    return False
                
                session = aiohttp.ClientSession()
                
                token_data = {
                    "grant_type": "refresh_token",
                    "client_id": settings.SALESFORCE_CLIENT_ID,
                    "client_secret": settings.SALESFORCE_CLIENT_SECRET,
                    "refresh_token": credentials["refresh_token"]
                }
                
                base_url = "https://test.salesforce.com" if connector.config.get("sandbox") else "https://login.salesforce.com"
                url = f"{base_url}/services/oauth2/token"
                
                async with session.post(url, data=token_data) as response:
                    if response.status == 200:
                        token_response = await response.json()
                        
                        # Update credentials
                        credentials["access_token"] = token_response["access_token"]
                        credentials["expires_at"] = datetime.utcnow() + timedelta(
                            seconds=token_response.get("expires_in", 3600)
                        )
                        
                        # TODO: Update connector in database with new credentials
                        return True
                
                await session.close()
                return False
            except Exception:
                return False
        
        return False
    
    async def get_connector_capabilities(self, connector_type: ConnectorType) -> Dict[str, Any]:
        """Get capabilities for a connector type"""
        capabilities = {
            ConnectorType.SALESFORCE: {
                "actions": ["query", "create", "update", "delete"],
                "auth_type": "oauth2",
                "supports_webhooks": True,
                "rate_limits": {"requests_per_hour": 15000}
            },
            ConnectorType.NETSUITE: {
                "actions": ["suiteql", "restlet", "search"],
                "auth_type": "token_based",
                "supports_webhooks": False,
                "rate_limits": {"requests_per_hour": 5000}
            },
            ConnectorType.EMAIL: {
                "actions": ["send"],
                "auth_type": "basic",
                "supports_webhooks": False,
                "rate_limits": {"emails_per_hour": 500}
            }
        }
        
        return capabilities.get(connector_type, {})

