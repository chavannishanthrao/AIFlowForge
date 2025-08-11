import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
import logging

from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    """Base class for all database models"""
    pass

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Initialize database with tables and extensions"""
    try:
        async with engine.begin() as conn:
            # Create pgvector extension if using PostgreSQL
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("PGVector extension created/verified")
            except Exception as e:
                logger.warning(f"Could not create vector extension: {e}")
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created/verified")
            
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

async def close_db():
    """Close database connections"""
    await engine.dispose()
    logger.info("Database connections closed")

# Health check function
async def check_db_health() -> bool:
    """Check if database is accessible"""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

# Migration utilities
async def run_migrations():
    """Run database migrations"""
    # TODO: Implement proper migration system using Alembic
    logger.info("Migration system not yet implemented")
    pass

async def create_indexes():
    """Create database indexes for performance"""
    try:
        async with engine.begin() as conn:
            # Create indexes for commonly queried fields
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
                "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
                "CREATE INDEX IF NOT EXISTS idx_skills_type ON skills(type);",
                "CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active);",
                "CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active);",
                "CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);",
                "CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);",
                "CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);",
                "CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);",
                "CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at);",
                "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);",
                "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);",
                "CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);",
                "CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);",
            ]
            
            for index_sql in indexes:
                try:
                    await conn.execute(text(index_sql))
                except Exception as e:
                    logger.warning(f"Could not create index: {e}")
            
            logger.info("Database indexes created/verified")
            
    except Exception as e:
        logger.error(f"Index creation failed: {e}")

# Vector database specific functions
async def setup_vector_tables():
    """Setup tables for vector storage if using PGVector"""
    try:
        async with engine.begin() as conn:
            # Create embeddings table for PGVector
            create_embeddings_table = text("""
                CREATE TABLE IF NOT EXISTS document_embeddings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    document_id UUID NOT NULL,
                    content TEXT NOT NULL,
                    embedding vector(1536),
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute(create_embeddings_table)
            
            # Create vector index for similarity search
            create_vector_index = text("""
                CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
                ON document_embeddings USING hnsw (embedding vector_cosine_ops);
            """)
            
            await conn.execute(create_vector_index)
            
            logger.info("Vector tables and indexes created")
            
    except Exception as e:
        logger.warning(f"Vector table setup failed: {e}")

# Data seeding for development
async def seed_development_data():
    """Seed database with development data"""
    if not settings.DEBUG:
        return
    
    try:
        async with AsyncSessionLocal() as session:
            # Check if data already exists
            result = await session.execute(text("SELECT COUNT(*) FROM users WHERE username = 'admin'"))
            admin_exists = result.scalar() > 0
            
            if not admin_exists:
                # Create admin user
                create_admin = text("""
                    INSERT INTO users (username, email, password, role) 
                    VALUES ('admin', 'admin@example.com', 'hashed_password', 'admin')
                """)
                await session.execute(create_admin)
                
                # Create sample skill
                create_skill = text("""
                    INSERT INTO skills (name, description, type, config, required_connectors, created_by) 
                    VALUES (
                        'Invoice Data Extraction',
                        'Extract structured data from PDF invoices',
                        'data_extraction',
                        '{"input_format": "pdf", "output_fields": ["vendor", "amount", "due_date"]}',
                        ARRAY['netsuite'],
                        (SELECT id FROM users WHERE username = 'admin')
                    )
                """)
                await session.execute(create_skill)
                
                await session.commit()
                logger.info("Development data seeded")
    
    except Exception as e:
        logger.error(f"Data seeding failed: {e}")

# Database backup utilities
async def backup_database(backup_path: str):
    """Create database backup"""
    # TODO: Implement database backup functionality
    logger.info(f"Database backup functionality not yet implemented. Path: {backup_path}")

async def restore_database(backup_path: str):
    """Restore database from backup"""
    # TODO: Implement database restore functionality
    logger.info(f"Database restore functionality not yet implemented. Path: {backup_path}")

# Connection pooling configuration
def configure_pool():
    """Configure connection pool settings"""
    return {
        "pool_size": 20,
        "max_overflow": 30,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    }

# Database monitoring
async def get_db_stats():
    """Get database statistics"""
    try:
        async with AsyncSessionLocal() as session:
            stats = {}
            
            # Get table counts
            tables = ["users", "skills", "agents", "workflows", "executions", "audit_logs", "documents"]
            
            for table in tables:
                result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                stats[f"{table}_count"] = result.scalar()
            
            # Get database size
            result = await session.execute(text("SELECT pg_size_pretty(pg_database_size(current_database()))"))
            stats["database_size"] = result.scalar()
            
            # Get connection count
            result = await session.execute(text("SELECT count(*) FROM pg_stat_activity"))
            stats["active_connections"] = result.scalar()
            
            return stats
            
    except Exception as e:
        logger.error(f"Failed to get database stats: {e}")
        return {}

# Clean up old data
async def cleanup_old_data(days: int = 90):
    """Clean up old execution and audit log data"""
    try:
        async with AsyncSessionLocal() as session:
            # Clean up old executions
            cleanup_executions = text("""
                DELETE FROM executions 
                WHERE started_at < NOW() - INTERVAL '%s days' 
                AND status IN ('success', 'failed', 'cancelled')
            """)
            result = await session.execute(cleanup_executions, (days,))
            executions_deleted = result.rowcount
            
            # Clean up old audit logs
            cleanup_audit_logs = text("""
                DELETE FROM audit_logs 
                WHERE timestamp < NOW() - INTERVAL '%s days'
            """)
            result = await session.execute(cleanup_audit_logs, (days,))
            audit_logs_deleted = result.rowcount
            
            await session.commit()
            
            logger.info(f"Cleaned up {executions_deleted} executions and {audit_logs_deleted} audit logs")
            
            return {
                "executions_deleted": executions_deleted,
                "audit_logs_deleted": audit_logs_deleted
            }
            
    except Exception as e:
        logger.error(f"Data cleanup failed: {e}")
        return {"error": str(e)}

