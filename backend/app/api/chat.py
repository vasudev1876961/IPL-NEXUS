"""Multi-Agent Cricket Intelligence Assistant API router."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any

from ai.agents.assistant import CricketIntelligenceAssistant

router = APIRouter(prefix="/api/chat", tags=["Cricket AI Assistant"])

_assistant = CricketIntelligenceAssistant()


class ChatQueryRequest(BaseModel):
    query: str = Field(..., example="Who has hit the most sixes in IPL history?")


@router.post("")
def ask_cricket_assistant(req: ChatQueryRequest):
    """Answer natural language cricket queries with verifiable database evidence."""
    response = _assistant.handle_query(req.query)
    return response
