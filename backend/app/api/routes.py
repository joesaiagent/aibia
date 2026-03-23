from fastapi import APIRouter
from pydantic import BaseModel
from app.agent.agent import run_agent

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    response, conversation_id = await run_agent(request.message, request.conversation_id)
    return ChatResponse(response=response, conversation_id=conversation_id)


@router.get("/health")
async def health():
    return {"status": "ok"}
