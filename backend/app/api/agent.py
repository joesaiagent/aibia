import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.agent.agent_loop import run_agent_loop

router = APIRouter()


class AgentRunRequest(BaseModel):
    task: str


@router.post("/run")
async def agent_run(request: AgentRunRequest, db: Session = Depends(get_db)):
    async def event_stream():
        async for event in run_agent_loop(request.task, db):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
