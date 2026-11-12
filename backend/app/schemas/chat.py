from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="Customer or user query")
    conversation_id: Optional[int] = Field(None, description="Existing conversation session ID")
    session_id: Optional[str] = Field(None, description="Cart / Guest session identifier")
    stream: bool = Field(False, description="Whether to stream response via SSE")

class ChatResponse(BaseModel):
    conversation_id: int
    message: str
    response: Optional[str] = None
    model_used: str
    sources: List[str] = Field(default_factory=list)
    tool_called: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def model_post_init(self, __context: Any) -> None:
        if not self.response and self.message:
            self.response = self.message

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    role: str
    message_content: str
    model_used: str
    sources: Optional[List[Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: int
    user_id: Optional[int]
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True

class ConversationSummary(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True
