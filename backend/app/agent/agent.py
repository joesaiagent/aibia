import uuid
from typing import AsyncGenerator
import anthropic
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.agent.prompts import SYSTEM_PROMPT
from app.models.chat_conversation import ChatConversation

load_dotenv()
client = anthropic.Anthropic()


async def stream_agent(message: str, conversation_id: str | None, user_id: str = "", db: Session = None) -> AsyncGenerator[dict, None]:
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    # Load or create conversation from DB
    record = None
    history = []
    if db:
        record = db.query(ChatConversation).filter(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == user_id,
        ).first()
        if record:
            history = list(record.messages or [])

    history.append({"role": "user", "content": message})

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

    # Save conversation to DB
    if db:
        if record:
            record.messages = history
        else:
            record = ChatConversation(
                id=conversation_id,
                user_id=user_id,
                messages=history,
            )
            db.add(record)
        db.commit()

    # Record token usage
    if db and user_id:
        from app.api.usage import record_usage
        record_usage(user_id, usage.input_tokens, usage.output_tokens, db)

    yield {"type": "done"}
