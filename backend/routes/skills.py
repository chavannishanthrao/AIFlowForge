from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import uuid
from datetime import datetime

from models import Skill, SkillCreate, SkillUpdate, SkillGenerate, SkillGenerateResponse, User
from routes.auth import get_current_user
from services.llm_service import LLMService

router = APIRouter()

# Mock skills database - replace with actual database
skills_db = {}

@router.get("/", response_model=List[Skill])
async def get_skills(current_user: User = Depends(get_current_user)):
    """Get all skills"""
    return list(skills_db.values())

@router.get("/{skill_id}", response_model=Skill)
async def get_skill(skill_id: str, current_user: User = Depends(get_current_user)):
    """Get skill by ID"""
    if skill_id not in skills_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    return skills_db[skill_id]

@router.post("/", response_model=Skill, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill_data: SkillCreate, 
    current_user: User = Depends(get_current_user)
):
    """Create a new skill"""
    skill_id = str(uuid.uuid4())
    
    skill = Skill(
        id=skill_id,
        name=skill_data.name,
        description=skill_data.description,
        type=skill_data.type,
        config=skill_data.config,
        required_connectors=skill_data.required_connectors,
        is_active=skill_data.is_active,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    skills_db[skill_id] = skill
    return skill

@router.put("/{skill_id}", response_model=Skill)
async def update_skill(
    skill_id: str,
    skill_update: SkillUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a skill"""
    if skill_id not in skills_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    skill = skills_db[skill_id]
    update_data = skill_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(skill, field, value)
    
    skill.updated_at = datetime.utcnow()
    skills_db[skill_id] = skill
    
    return skill

@router.delete("/{skill_id}")
async def delete_skill(
    skill_id: str, 
    current_user: User = Depends(get_current_user)
):
    """Delete a skill"""
    if skill_id not in skills_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    del skills_db[skill_id]
    return {"message": "Skill deleted successfully"}

@router.post("/generate", response_model=SkillGenerateResponse)
async def generate_skill(
    generate_request: SkillGenerate,
    current_user: User = Depends(get_current_user)
):
    """Generate a skill using AI"""
    try:
        llm_service = LLMService()
        generated_skill = await llm_service.generate_skill(
            generate_request.prompt,
            generate_request.skill_name
        )
        
        return SkillGenerateResponse(
            skill=generated_skill,
            confidence=0.85
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate skill: {str(e)}"
        )

@router.post("/{skill_id}/validate")
async def validate_skill(
    skill_id: str,
    test_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Validate a skill with test data"""
    if skill_id not in skills_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    skill = skills_db[skill_id]
    
    # TODO: Implement skill validation logic
    # This would typically run the skill with test data
    
    return {
        "skill_id": skill_id,
        "validation_status": "success",
        "output": {"message": "Skill validation completed successfully"},
        "execution_time_ms": 150
    }

@router.get("/{skill_id}/executions")
async def get_skill_executions(
    skill_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get execution history for a skill"""
    if skill_id not in skills_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    # TODO: Implement actual execution history retrieval
    return {
        "skill_id": skill_id,
        "executions": [
            {
                "id": "exec-1",
                "status": "success",
                "executed_at": "2023-12-01T10:00:00Z",
                "execution_time_ms": 145
            },
            {
                "id": "exec-2", 
                "status": "success",
                "executed_at": "2023-12-01T09:30:00Z",
                "execution_time_ms": 132
            }
        ],
        "total": 2
    }

# Initialize with sample skill
if not skills_db:
    sample_skill = Skill(
        id="sample-skill-1",
        name="Invoice Data Extraction",
        description="Extract structured data from PDF invoices",
        type="data_extraction",
        config={
            "input_format": "pdf",
            "output_fields": ["vendor", "amount", "due_date", "line_items"],
            "validation_rules": ["amount > 0", "due_date is future"]
        },
        required_connectors=["netsuite"],
        is_active=True,
        created_by="admin-user-id",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    skills_db[sample_skill.id] = sample_skill
