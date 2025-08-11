import openai
import os
from typing import Dict, Any, Optional, List
import json
import asyncio
from datetime import datetime

from models import SkillCreate, SkillType
from config import settings

class LLMProvider:
    """Base class for LLM providers"""
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text using the LLM"""
        raise NotImplementedError
    
    async def generate_structured_output(self, prompt: str, schema: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Generate structured output matching a schema"""
        raise NotImplementedError

class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        if self.api_key:
            openai.api_key = self.api_key
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text using OpenAI"""
        try:
            response = await openai.ChatCompletion.acreate(
                model=kwargs.get("model", "gpt-3.5-turbo"),
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates AI skills for enterprise automation."},
                    {"role": "user", "content": prompt}
                ],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 1000)
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    async def generate_structured_output(self, prompt: str, schema: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Generate structured output using OpenAI"""
        structured_prompt = f"""
        {prompt}
        
        Please respond with a JSON object that matches this schema:
        {json.dumps(schema, indent=2)}
        
        Respond only with valid JSON, no other text.
        """
        
        response_text = await self.generate_text(structured_prompt, **kwargs)
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start != -1 and end != 0:
                return json.loads(response_text[start:end])
            raise Exception("Failed to parse JSON response from LLM")

class AzureOpenAIProvider(LLMProvider):
    """Azure OpenAI provider"""
    
    def __init__(self, api_key: Optional[str] = None, endpoint: Optional[str] = None):
        self.api_key = api_key or settings.AZURE_OPENAI_KEY
        self.endpoint = endpoint or settings.AZURE_OPENAI_ENDPOINT
        
        if self.api_key and self.endpoint:
            openai.api_type = "azure"
            openai.api_key = self.api_key
            openai.api_base = self.endpoint
            openai.api_version = "2023-05-15"
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text using Azure OpenAI"""
        try:
            response = await openai.ChatCompletion.acreate(
                engine=kwargs.get("deployment_name", "gpt-35-turbo"),
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates AI skills for enterprise automation."},
                    {"role": "user", "content": prompt}
                ],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 1000)
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Azure OpenAI API error: {str(e)}")

class OllamaProvider(LLMProvider):
    """Ollama local LLM provider"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
    
    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text using Ollama"""
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                data = {
                    "model": kwargs.get("model", "llama2"),
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": kwargs.get("temperature", 0.7),
                        "num_predict": kwargs.get("max_tokens", 1000)
                    }
                }
                
                async with session.post(f"{self.base_url}/api/generate", json=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get("response", "")
                    else:
                        raise Exception(f"Ollama API error: {response.status}")
        except Exception as e:
            raise Exception(f"Ollama connection error: {str(e)}")

class LLMService:
    """Main LLM service with provider abstraction"""
    
    def __init__(self, provider_type: str = "openai"):
        self.provider_type = provider_type
        self.provider = self._create_provider(provider_type)
    
    def _create_provider(self, provider_type: str) -> LLMProvider:
        """Create LLM provider instance"""
        if provider_type == "openai":
            return OpenAIProvider()
        elif provider_type == "azure":
            return AzureOpenAIProvider()
        elif provider_type == "ollama":
            return OllamaProvider()
        else:
            raise ValueError(f"Unknown provider type: {provider_type}")
    
    async def generate_skill(self, prompt: str, skill_name: str) -> SkillCreate:
        """Generate a skill from natural language description"""
        skill_prompt = f"""
        Create an AI skill configuration for: {skill_name}
        
        Description: {prompt}
        
        Generate a skill configuration that includes:
        - Appropriate skill type (data_extraction, data_processing, communication, analysis, automation)
        - Configuration parameters for the skill
        - Required connectors if any
        - A clear description
        
        The skill should be production-ready and follow enterprise best practices.
        """
        
        schema = {
            "name": "string",
            "description": "string", 
            "type": "string (one of: data_extraction, data_processing, communication, analysis, automation)",
            "config": {
                "input_format": "string",
                "output_format": "string",
                "processing_steps": ["array of strings"],
                "validation_rules": ["array of strings"],
                "model_parameters": {
                    "temperature": "number",
                    "max_tokens": "number"
                }
            },
            "required_connectors": ["array of strings"]
        }
        
        try:
            result = await self.provider.generate_structured_output(skill_prompt, schema)
            
            # Map string type to enum
            skill_type = SkillType.DATA_PROCESSING  # default
            type_mapping = {
                "data_extraction": SkillType.DATA_EXTRACTION,
                "data_processing": SkillType.DATA_PROCESSING,
                "communication": SkillType.COMMUNICATION,
                "analysis": SkillType.ANALYSIS,
                "automation": SkillType.AUTOMATION
            }
            if result.get("type") in type_mapping:
                skill_type = type_mapping[result["type"]]
            
            return SkillCreate(
                name=result.get("name", skill_name),
                description=result.get("description", "AI-generated skill"),
                type=skill_type,
                config=result.get("config", {}),
                required_connectors=result.get("required_connectors", []),
                is_active=True
            )
        except Exception as e:
            # Fallback to simple skill if generation fails
            return SkillCreate(
                name=skill_name,
                description=f"AI-generated skill: {prompt[:200]}...",
                type=SkillType.DATA_PROCESSING,
                config={
                    "prompt": prompt,
                    "model": "gpt-3.5-turbo",
                    "temperature": 0.7,
                    "max_tokens": 1000
                },
                required_connectors=[],
                is_active=True
            )
    
    async def execute_skill(self, skill_config: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a skill with given input data"""
        skill_prompt = skill_config.get("prompt", "Process the following data:")
        
        if input_data:
            data_prompt = f"{skill_prompt}\n\nInput data:\n{json.dumps(input_data, indent=2)}"
        else:
            data_prompt = skill_prompt
        
        try:
            result = await self.provider.generate_text(
                data_prompt,
                temperature=skill_config.get("temperature", 0.7),
                max_tokens=skill_config.get("max_tokens", 1000),
                model=skill_config.get("model", "gpt-3.5-turbo")
            )
            
            return {
                "status": "success",
                "result": result,
                "executed_at": datetime.utcnow().isoformat(),
                "model_used": skill_config.get("model", "gpt-3.5-turbo")
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "executed_at": datetime.utcnow().isoformat()
            }
    
    async def analyze_text(self, text: str, analysis_type: str = "general") -> Dict[str, Any]:
        """Analyze text using LLM"""
        prompts = {
            "sentiment": "Analyze the sentiment of the following text. Provide a sentiment score from -1 (very negative) to 1 (very positive) and explain your reasoning.",
            "summary": "Provide a concise summary of the following text, highlighting the key points.",
            "entities": "Extract named entities from the following text. Identify people, organizations, locations, dates, and other relevant entities.",
            "classification": "Classify the following text into appropriate categories and explain your classification.",
            "general": "Analyze the following text and provide insights about its content, structure, and meaning."
        }
        
        prompt = prompts.get(analysis_type, prompts["general"])
        full_prompt = f"{prompt}\n\nText to analyze:\n{text}"
        
        try:
            result = await self.provider.generate_text(full_prompt)
            return {
                "analysis_type": analysis_type,
                "result": result,
                "analyzed_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "analysis_type": analysis_type,
                "error": str(e),
                "analyzed_at": datetime.utcnow().isoformat()
            }
    
    async def chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Complete a chat conversation"""
        # Convert messages to a single prompt for simple providers
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_parts.append(f"{role.title()}: {content}")
        
        full_prompt = "\n".join(prompt_parts) + "\nAssistant:"
        
        return await self.provider.generate_text(full_prompt, **kwargs)
