import uuid
import anthropic
from app.agent.prompts import SYSTEM_PROMPT

client = anthropic.Anthropic()
conversations: dict[str, list] = {}


async def run_agent(message: str, conversation_id: str | None) -> tuple[str, str]:
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    history = conversations.setdefault(conversation_id, [])
    history.append({"role": "user", "content": message})

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=history,
    )

    reply = response.content[0].text
    history.append({"role": "assistant", "content": reply})

    return reply, conversation_id
