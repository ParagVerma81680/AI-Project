from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class MemoryCreate(BaseModel):
    memory_type: str = Field("preference", description="Type of memory: preference, dietary, fact")
    memory_content: str = Field(..., min_length=2, max_length=2000)
    importance_score: float = Field(0.8, ge=0.0, le=1.0)

class MemoryOut(BaseModel):
    id: int
    user_id: int
    memory_type: str
    memory_content: str
    importance_score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MemoryList(BaseModel):
    total: int
    memories: List[MemoryOut]
