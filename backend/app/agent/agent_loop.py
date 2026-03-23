import asyncio
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
        text_so_far = ""
        tool_uses = []
        stop_reason = None

        # Run synchronous streaming in a thread to avoid blocking the event loop
        def do_stream():
            nonlocal text_so_far, tool_uses, stop_reason
            with client.messages.stream(
                model="claude-opus-4-6",
                max_tokens=4096,
                system=AGENT_SYSTEM_PROMPT,
                tools=ALL_TOOLS,
                messages=messages,
            ) as stream:
                for event in stream:
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            text_so_far += event.delta.text
                    elif event.type == "message_stop":
                        pass

                final = stream.get_final_message()
                stop_reason = final.stop_reason
                for block in final.content:
                    if block.type == "tool_use":
                        tool_uses.append(block)
                return final

        # Stream text chunks via a queue
        text_queue: asyncio.Queue = asyncio.Queue()
        done_event = asyncio.Event()

        def do_stream_with_queue():
            nonlocal text_so_far, tool_uses, stop_reason
            with client.messages.stream(
                model="claude-opus-4-6",
                max_tokens=4096,
                system=AGENT_SYSTEM_PROMPT,
                tools=ALL_TOOLS,
                messages=messages,
            ) as stream:
                for event in stream:
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text") and event.delta.text:
                            text_queue.put_nowait(event.delta.text)

                final = stream.get_final_message()
                stop_reason = final.stop_reason
                for block in final.content:
                    if block.type == "tool_use":
                        tool_uses.append(block)

            done_event.set()

        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(None, do_stream_with_queue)

        accumulated_text = ""
        while not done_event.is_set() or not text_queue.empty():
            try:
                chunk = text_queue.get_nowait()
                accumulated_text += chunk
                yield {"type": "text_delta", "content": chunk}
            except asyncio.QueueEmpty:
                await asyncio.sleep(0.05)

        await future

        if accumulated_text:
            yield {"type": "text", "content": accumulated_text}

        # Build assistant message content
        assistant_content = []
        if accumulated_text:
            assistant_content.append({"type": "text", "text": accumulated_text})

        if not tool_uses:
            if assistant_content:
                messages.append({"role": "assistant", "content": assistant_content})
            break

        # Process each tool call
        for block in tool_uses:
            assistant_content.append({
                "type": "tool_use",
                "id": block.id,
                "name": block.name,
                "input": block.input,
            })
            yield {"type": "tool_start", "tool": block.name, "input": block.input}

            handler = TOOL_HANDLERS.get(block.name)
            result = handler(block.input, db) if handler else {"error": f"Unknown tool: {block.name}"}

            yield {"type": "tool_result", "tool": block.name, "result": result}

            if isinstance(result, dict) and result.get("status") == "queued_for_approval":
                yield {
                    "type": "approval_created",
                    "approval_id": result.get("approval_id"),
                    "title": result.get("title", ""),
                }

        messages.append({"role": "assistant", "content": assistant_content})
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": str(result),
                }
                for block in tool_uses
            ],
        })

        if stop_reason == "end_turn":
            break

    yield {"type": "done"}
