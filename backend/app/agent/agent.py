import uuid
from typing import AsyncGenerator
import anthropic
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.agent.prompts import SYSTEM_PROMPT

load_dotenv()
client = anthropic.Anthropic()
conversations: dict[str, list] = {}


async def stream_agent(message: str, conversation_id: str | None, user_id: str = "", db: Session = None) -> AsyncGenerator[dict, None]:
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    # Scope conversation history by user to prevent cross-user access
    scoped_key = f"{user_id}:{conversation_id}"
    history = conversations.setdefault(scoped_key, [])
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
        usage = stream.get_final_message().usage

    history.append({"role": "assistant", "content": full_reply})

    # Record token usage
    if db and user_id:
        from app.api.usage import record_usage
        record_usage(user_id, usage.input_tokens, usage.output_tokens, db)

    yield {"type": "done"}
