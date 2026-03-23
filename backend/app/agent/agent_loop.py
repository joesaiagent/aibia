import anthropic
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.agent.tools import ALL_TOOLS, TOOL_HANDLERS

load_dotenv()
client = anthropic.Anthropic()

AGENT_SYSTEM_PROMPT = """You are aibia, an autonomous AI business agent for small businesses.

You have access to real tools. Use them proactively to complete the user's task:
- Search the web to find leads and research prospects
- Save promising leads to the database
- Draft personalized outreach emails (they go to an approval queue first)
- Draft social media posts (they go to an approval queue first)
- Read connected email inboxes
- Search and update existing leads

Always be proactive: if asked to find leads, search + save them. If asked to do outreach, draft emails.
Explain your reasoning before and after each tool call.
When drafting emails or posts, confirm they have been queued for the user's approval.
Never send emails or post to social media directly — always queue for approval.
"""

MAX_ITERATIONS = 20


async def run_agent_loop(task: str, db: Session) -> AsyncGenerator[dict, None]:
    messages = [{"role": "user", "content": task}]

    for _ in range(MAX_ITERATIONS):
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=AGENT_SYSTEM_PROMPT,
            tools=ALL_TOOLS,
            messages=messages,
        )

        assistant_content = []

        for block in response.content:
            if block.type == "text":
                assistant_content.append({"type": "text", "text": block.text})
                yield {"type": "text", "content": block.text}

            elif block.type == "tool_use":
                assistant_content.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })
                yield {"type": "tool_start", "tool": block.name, "input": block.input}

                handler = TOOL_HANDLERS.get(block.name)
                if handler:
                    result = handler(block.input, db)
                else:
                    result = {"error": f"Unknown tool: {block.name}"}

                yield {"type": "tool_result", "tool": block.name, "result": result}

                # If approval was created, emit special event for UI badge update
                if isinstance(result, dict) and result.get("status") == "queued_for_approval":
                    yield {
                        "type": "approval_created",
                        "approval_id": result.get("approval_id"),
                        "title": result.get("title", ""),
                    }

                messages.append({"role": "assistant", "content": assistant_content})
                messages.append({
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result),
                    }],
                })
                assistant_content = []
                break  # restart loop after tool call

        else:
            # No tool calls this iteration — append and check stop reason
            if assistant_content:
                messages.append({"role": "assistant", "content": assistant_content})

        if response.stop_reason == "end_turn":
            break

    yield {"type": "done"}
