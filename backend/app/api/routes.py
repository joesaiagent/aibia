import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.agent.agent import stream_agent

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


@router.post("/chat")
async def chat(request: ChatRequest):
    async def event_stream():
        async for chunk in stream_agent(request.message, request.conversation_id):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/health")
async def health():
    return {"status": "ok"}
