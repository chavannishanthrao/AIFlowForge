import numpy as np
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import uuid
import json
import os
from abc import ABC, abstractmethod

from models import Document, DocumentCreate
from config import settings

class VectorStore(ABC):
    """Abstract base class for vector stores"""
    
    @abstractmethod
    async def store_document(self, document: Document, embedding: List[float]) -> str:
        """Store a document with its embedding"""
        pass
    
    @abstractmethod
    async def search_similar(self, query_embedding: List[float], limit: int = 10, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        pass
    
    @abstractmethod
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from the store"""
        pass
    
    @abstractmethod
    async def get_document(self, document_id: str) -> Optional[Document]:
        """Get a document by ID"""
        pass

class PGVectorStore(VectorStore):
    """PostgreSQL with PGVector extension"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        # TODO: Initialize asyncpg connection pool
        self.initialized = False
    
    async def initialize(self):
        """Initialize the vector store"""
        if self.initialized:
            return
        
        # TODO: Implement actual PGVector initialization
        # - Create vector extension
        # - Create embeddings table
        # - Create vector indexes
        self.initialized = True
    
    async def store_document(self, document: Document, embedding: List[float]) -> str:
        """Store document with embedding in PostgreSQL"""
        await self.initialize()
        
        # TODO: Implement actual PostgreSQL storage
        # INSERT INTO documents_embeddings (document_id, content, embedding) VALUES (...)
        
        return document.id
    
    async def search_similar(self, query_embedding: List[float], limit: int = 10, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Search using cosine similarity in PostgreSQL"""
        await self.initialize()
        
        # TODO: Implement actual similarity search
        # SELECT document_id, content, (embedding <=> %s) as distance 
        # FROM documents_embeddings 
        # WHERE (embedding <=> %s) < %s 
        # ORDER BY distance LIMIT %s
        
        return []

class MilvusVectorStore(VectorStore):
    """Milvus vector database implementation"""
    
    def __init__(self, host: str = "localhost", port: int = 19530):
        self.host = host
        self.port = port
        self.collection_name = "documents"
        # TODO: Initialize Milvus connection
        self.initialized = False
    
    async def initialize(self):
        """Initialize Milvus collection"""
        if self.initialized:
            return
        
        # TODO: Implement Milvus initialization
        # - Connect to Milvus
        # - Create collection with appropriate schema
        # - Create index for vector field
        self.initialized = True
    
    async def store_document(self, document: Document, embedding: List[float]) -> str:
        """Store document in Milvus"""
        await self.initialize()
        
        # TODO: Implement Milvus storage
        # collection.insert([{
        #     "id": document.id,
        #     "content": document.content,
        #     "embedding": embedding,
        #     "metadata": document.metadata
        # }])
        
        return document.id
    
    async def search_similar(self, query_embedding: List[float], limit: int = 10, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Search similar documents in Milvus"""
        await self.initialize()
        
        # TODO: Implement Milvus search
        # search_params = {"metric_type": "COSINE", "params": {"nprobe": 16}}
        # results = collection.search([query_embedding], "embedding", search_params, limit)
        
        return []

class InMemoryVectorStore(VectorStore):
    """In-memory vector store for development/testing"""
    
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.embeddings: Dict[str, List[float]] = {}
    
    async def store_document(self, document: Document, embedding: List[float]) -> str:
        """Store document in memory"""
        self.documents[document.id] = document
        self.embeddings[document.id] = embedding
        return document.id
    
    async def search_similar(self, query_embedding: List[float], limit: int = 10, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Search using cosine similarity in memory"""
        if not self.embeddings:
            return []
        
        similarities = []
        query_vec = np.array(query_embedding)
        
        for doc_id, doc_embedding in self.embeddings.items():
            doc_vec = np.array(doc_embedding)
            
            # Calculate cosine similarity
            cosine_sim = np.dot(query_vec, doc_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(doc_vec))
            
            if cosine_sim >= threshold:
                document = self.documents.get(doc_id)
                if document:
                    similarities.append({
                        "document_id": doc_id,
                        "document": document,
                        "similarity": float(cosine_sim)
                    })
        
        # Sort by similarity (highest first) and limit results
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        return similarities[:limit]
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete document from memory"""
        if document_id in self.documents:
            del self.documents[document_id]
            del self.embeddings[document_id]
            return True
        return False
    
    async def get_document(self, document_id: str) -> Optional[Document]:
        """Get document from memory"""
        return self.documents.get(document_id)

class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers"""
    
    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text"""
        pass
    
    @abstractmethod
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings"""
        pass

class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI embedding provider"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-ada-002"):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model
        self.dimension = 1536  # ada-002 dimension
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI"""
        try:
            import openai
            if self.api_key:
                openai.api_key = self.api_key
            
            response = await openai.Embedding.acreate(
                model=self.model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            raise Exception(f"OpenAI embedding error: {str(e)}")
    
    def get_embedding_dimension(self) -> int:
        return self.dimension

class HuggingFaceEmbeddingProvider(EmbeddingProvider):
    """Hugging Face embedding provider"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self.dimension = 384  # MiniLM dimension
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using Hugging Face"""
        try:
            if self.model is None:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(self.model_name)
            
            embedding = self.model.encode(text)
            return embedding.tolist()
        except Exception as e:
            raise Exception(f"Hugging Face embedding error: {str(e)}")
    
    def get_embedding_dimension(self) -> int:
        return self.dimension

class VectorService:
    """Main vector service for RAG and document search"""
    
    def __init__(self, vector_store_type: str = "memory", embedding_provider_type: str = "huggingface"):
        self.vector_store = self._create_vector_store(vector_store_type)
        self.embedding_provider = self._create_embedding_provider(embedding_provider_type)
        self.chunk_size = 1000
        self.chunk_overlap = 200
    
    def _create_vector_store(self, store_type: str) -> VectorStore:
        """Create vector store instance"""
        if store_type == "pgvector":
            return PGVectorStore(settings.DATABASE_URL)
        elif store_type == "milvus":
            return MilvusVectorStore()
        elif store_type == "memory":
            return InMemoryVectorStore()
        else:
            raise ValueError(f"Unknown vector store type: {store_type}")
    
    def _create_embedding_provider(self, provider_type: str) -> EmbeddingProvider:
        """Create embedding provider instance"""
        if provider_type == "openai":
            return OpenAIEmbeddingProvider()
        elif provider_type == "huggingface":
            return HuggingFaceEmbeddingProvider()
        else:
            raise ValueError(f"Unknown embedding provider type: {provider_type}")
    
    def _chunk_text(self, text: str) -> List[str]:
        """Split text into chunks for better embedding"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunk_words = words[i:i + self.chunk_size]
            chunk = " ".join(chunk_words)
            chunks.append(chunk)
        
        return chunks
    
    async def store_document(self, document_create: DocumentCreate) -> Document:
        """Store a document with automatic chunking and embedding"""
        document_id = str(uuid.uuid4())
        
        document = Document(
            id=document_id,
            title=document_create.title,
            content=document_create.content,
            metadata=document_create.metadata or {},
            embedding=None,
            uploaded_by=document_create.uploaded_by,
            created_at=datetime.utcnow()
        )
        
        # Generate chunks
        chunks = self._chunk_text(document.content)
        
        # Store each chunk with embedding
        for i, chunk in enumerate(chunks):
            chunk_embedding = await self.embedding_provider.generate_embedding(chunk)
            
            chunk_document = Document(
                id=f"{document_id}_chunk_{i}",
                title=f"{document.title} (Chunk {i+1})",
                content=chunk,
                metadata={
                    **document.metadata,
                    "parent_document_id": document_id,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                },
                embedding=json.dumps(chunk_embedding),
                uploaded_by=document.uploaded_by,
                created_at=document.created_at
            )
            
            await self.vector_store.store_document(chunk_document, chunk_embedding)
        
        # Store main document
        main_embedding = await self.embedding_provider.generate_embedding(
            f"{document.title} {document.content[:500]}"  # Title + first 500 chars
        )
        document.embedding = json.dumps(main_embedding)
        await self.vector_store.store_document(document, main_embedding)
        
        return document
    
    async def search_documents(
        self, 
        query: str, 
        limit: int = 10, 
        threshold: float = 0.7,
        include_chunks: bool = True
    ) -> List[Dict[str, Any]]:
        """Search for relevant documents"""
        query_embedding = await self.embedding_provider.generate_embedding(query)
        
        results = await self.vector_store.search_similar(
            query_embedding, 
            limit * 2,  # Get more results to filter
            threshold
        )
        
        # Group results by parent document if needed
        if not include_chunks:
            parent_docs = {}
            for result in results:
                metadata = result["document"].metadata or {}
                parent_id = metadata.get("parent_document_id", result["document"].id)
                
                if parent_id not in parent_docs or result["similarity"] > parent_docs[parent_id]["similarity"]:
                    parent_docs[parent_id] = result
            
            results = list(parent_docs.values())
        
        return results[:limit]
    
    async def get_relevant_context(
        self, 
        query: str, 
        max_context_length: int = 4000
    ) -> Dict[str, Any]:
        """Get relevant context for RAG"""
        search_results = await self.search_documents(query, limit=20, threshold=0.6)
        
        context_parts = []
        total_length = 0
        
        for result in search_results:
            document = result["document"]
            content = document.content
            
            if total_length + len(content) <= max_context_length:
                context_parts.append({
                    "content": content,
                    "title": document.title,
                    "similarity": result["similarity"],
                    "metadata": document.metadata
                })
                total_length += len(content)
            else:
                # Add partial content if it fits
                remaining_length = max_context_length - total_length
                if remaining_length > 100:  # Only add if meaningful length
                    context_parts.append({
                        "content": content[:remaining_length] + "...",
                        "title": document.title,
                        "similarity": result["similarity"],
                        "metadata": document.metadata
                    })
                break
        
        combined_context = "\n\n".join([
            f"Document: {part['title']}\n{part['content']}" 
            for part in context_parts
        ])
        
        return {
            "context": combined_context,
            "sources": context_parts,
            "total_sources": len(context_parts),
            "context_length": len(combined_context)
        }
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document and all its chunks"""
        success = await self.vector_store.delete_document(document_id)
        
        # Also delete chunks (in a real implementation, this would be more efficient with a query)
        # TODO: Implement chunk deletion based on parent_document_id
        
        return success
    
    async def get_document(self, document_id: str) -> Optional[Document]:
        """Get a document by ID"""
        return await self.vector_store.get_document(document_id)
    
    async def reindex_documents(self) -> Dict[str, Any]:
        """Reindex all documents with new embeddings"""
        # TODO: Implement reindexing logic
        # This would be useful when changing embedding models
        
        return {
            "status": "completed",
            "reindexed_count": 0,
            "started_at": datetime.utcnow().isoformat()
        }
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the document collection"""
        # TODO: Implement stats collection
        
        return {
            "total_documents": 0,
            "total_chunks": 0,
            "embedding_dimension": self.embedding_provider.get_embedding_dimension(),
            "vector_store_type": type(self.vector_store).__name__,
            "embedding_provider_type": type(self.embedding_provider).__name__
        }

