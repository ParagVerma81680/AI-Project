from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class KnowledgeCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content: str = Field(..., min_length=5)
    category: Optional[str] = "General"
    source: Optional[str] = "manual"

class KnowledgeOut(BaseModel):
    id: int
    title: str
    content: str
    category: str
    source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class KnowledgeList(BaseModel):
    total: int
    items: List[KnowledgeOut]

class KnowledgeUploadResponse(BaseModel):
    filename: str
    chunks_created: int
    category: str
    status: str = "success"
