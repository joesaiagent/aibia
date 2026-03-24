import json
from sqlalchemy.orm import Session
from app.models.lead import Lead, LeadNote
from app.models.approval_item import ApprovalItem
from app.models.social_post import SocialPost
from app.models.email_message import EmailMessage
from app.models.email_account import EmailAccount


def handle_web_search(input: dict, db: Session, user_id: str = "") -> dict:
    from app.config import settings
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=settings.tavily_api_key)
        results = client.search(
            query=input["query"],
            max_results=input.get("max_results", 5),
        )
        return {
            "results": [
                {"title": r.get("title"), "url": r.get("url"), "content": r.get("content", "")[:500]}
                for r in results.get("results", [])
            ]
        }
    except Exception as e:
        return {"error": str(e), "hint": "Add TAVILY_API_KEY to backend/.env — get one at https://tavily.com"}


def handle_create_lead(input: dict, db: Session, user_id: str = "") -> dict:
    lead = Lead(
        name=input["name"],
        company=input.get("company"),
        email=input.get("email"),
        phone=input.get("phone"),
        website=input.get("website"),
        linkedin_url=input.get("linkedin_url"),
        source=input.get("source", "manual"),
        notes=input.get("notes"),
        user_id=user_id or None,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return {"lead_id": lead.id, "name": lead.name, "status": "created"}


def handle_search_leads(input: dict, db: Session, user_id: str = "") -> dict:
    if not user_id:
        return {"leads": []}
    query = db.query(Lead).filter(Lead.user_id == user_id)
    if input.get("status"):
        query = query.filter(Lead.status == input["status"])
    if input.get("query"):
        q = f"%{input['query']}%"
        query = query.filter(
            Lead.name.ilike(q) | Lead.company.ilike(q) | Lead.email.ilike(q)
        )
    leads = query.limit(input.get("limit", 10)).all()
    return {
        "leads": [
            {"id": l.id, "name": l.name, "company": l.company, "email": l.email, "status": l.status}
            for l in leads
        ]
    }


def handle_update_lead(input: dict, db: Session, user_id: str = "") -> dict:
    if not user_id:
        return {"error": "Not authenticated"}
    lead = db.query(Lead).filter(Lead.id == input["lead_id"], Lead.user_id == user_id).first()
    if not lead:
        return {"error": f"Lead {input['lead_id']} not found"}
    if input.get("status"):
        lead.status = input["status"]
    if input.get("score") is not None:
        lead.score = input["score"]
    if input.get("notes"):
        note = LeadNote(lead_id=lead.id, content=input["notes"], source="agent")
        db.add(note)
    db.commit()
    return {"lead_id": lead.id, "updated": True}


def handle_read_inbox(input: dict, db: Session, user_id: str = "") -> dict:
    if not user_id:
        return {"error": "Not authenticated"}
    account = db.query(EmailAccount).filter(
        EmailAccount.email_address == input["account_email"],
        EmailAccount.user_id == user_id,
        EmailAccount.is_active == True,
    ).first()
    if not account:
        return {"error": f"No connected account found for {input['account_email']}. Connect an email account in Settings."}

    messages = db.query(EmailMessage).filter(
        EmailMessage.account_id == account.id
    )
    if input.get("unread_only"):
        messages = messages.filter(EmailMessage.is_read == False)
    messages = messages.order_by(EmailMessage.received_at.desc()).limit(input.get("max_results", 10)).all()

    return {
        "messages": [
            {"id": m.id, "subject": m.subject, "sender": m.sender, "is_read": m.is_read, "received_at": str(m.received_at)}
            for m in messages
        ]
    }


def handle_draft_email(input: dict, db: Session, user_id: str = "") -> dict:
    payload = json.dumps({
        "to": input["to"],
        "subject": input["subject"],
        "body": input["body"],
        "from_account": input["from_account"],
        "lead_id": input.get("lead_id"),
    })
    approval = ApprovalItem(
        type="email_send",
        title=f"Send email to {input['to']}: {input['subject'][:50]}",
        description="Outreach email drafted by aibia agent",
        payload=payload,
        user_id=user_id or None,
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    return {"status": "queued_for_approval", "approval_id": approval.id, "title": approval.title}


def handle_draft_social_post(input: dict, db: Session, user_id: str = "") -> dict:
    hashtags = json.dumps(input.get("hashtags", []))
    post = SocialPost(
        platform=input["platform"],
        content=input["content"],
        hashtags=hashtags,
        status="pending_approval",
        user_id=user_id or None,
    )
    db.add(post)
    db.flush()

    payload = json.dumps({
        "platform": input["platform"],
        "content": input["content"],
        "hashtags": input.get("hashtags", []),
        "media_description": input.get("media_description", ""),
        "post_id": post.id,
    })
    approval = ApprovalItem(
        type="social_post",
        title=f"Post to {input['platform']}: {input['content'][:60]}...",
        description="Social post drafted by aibia agent",
        payload=payload,
        reference_id=post.id,
        user_id=user_id or None,
    )
    db.add(approval)
    post.approval_item_id = approval.id
    db.commit()
    db.refresh(approval)
    return {"status": "queued_for_approval", "approval_id": approval.id, "platform": input["platform"]}


TOOL_HANDLERS = {
    "web_search": handle_web_search,
    "create_lead": handle_create_lead,
    "search_leads": handle_search_leads,
    "update_lead": handle_update_lead,
    "read_inbox": handle_read_inbox,
    "draft_email": handle_draft_email,
    "draft_social_post": handle_draft_social_post,
}
