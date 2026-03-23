import uuid
from typing import AsyncGenerator
import anthropic
from dotenv import load_dotenv
from app.agent.prompts import SYSTEM_PROMPT

load_dotenv()
client = anthropic.Anthropic()
conversations: dict[str, list] = {}


async def stream_agent(message: str, conversation_id: str | None) -> AsyncGenerator[dict, None]:
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    history = conversations.setdefault(conversation_id, [])
    history.append({"role": "user", "content": message})

    # Yield conversation_id first so the frontend can track it
    yield {"type": "start", "conversation_id": conversation_id}

    full_reply = ""
    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=history,
    ) as stream:
        for text in stream.text_stream:
            full_reply += text
            yield {"type": "delta", "text": text}

    history.append({"role": "assistant", "content": full_reply})
    yield {"type": "done"}
