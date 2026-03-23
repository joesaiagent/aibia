WEB_SEARCH_TOOL = {
    "name": "web_search",
    "description": "Search the web for business leads, competitor info, market research, or any public information.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "The search query"},
            "max_results": {"type": "integer", "default": 5},
        },
        "required": ["query"],
    },
}

CREATE_LEAD_TOOL = {
    "name": "create_lead",
    "description": "Save a prospect to the lead database after finding them via web search or email.",
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "company": {"type": "string"},
            "email": {"type": "string"},
            "phone": {"type": "string"},
            "website": {"type": "string"},
            "linkedin_url": {"type": "string"},
            "source": {"type": "string", "enum": ["web_search", "manual", "email_import"]},
            "notes": {"type": "string"},
        },
        "required": ["name"],
    },
}

SEARCH_LEADS_TOOL = {
    "name": "search_leads",
    "description": "Search the lead database by name, company, email, or status.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "status": {"type": "string", "enum": ["new", "contacted", "qualified", "won", "lost"]},
            "limit": {"type": "integer", "default": 10},
        },
    },
}

UPDATE_LEAD_TOOL = {
    "name": "update_lead",
    "description": "Update a lead's status, notes, or score.",
    "input_schema": {
        "type": "object",
        "properties": {
            "lead_id": {"type": "string"},
            "status": {"type": "string", "enum": ["new", "contacted", "qualified", "won", "lost"]},
            "notes": {"type": "string"},
            "score": {"type": "integer", "minimum": 0, "maximum": 100},
        },
        "required": ["lead_id"],
    },
}

READ_INBOX_TOOL = {
    "name": "read_inbox",
    "description": "Read recent emails from a connected email account.",
    "input_schema": {
        "type": "object",
        "properties": {
            "account_email": {"type": "string"},
            "max_results": {"type": "integer", "default": 10},
            "unread_only": {"type": "boolean", "default": False},
        },
        "required": ["account_email"],
    },
}

DRAFT_EMAIL_TOOL = {
    "name": "draft_email",
    "description": "Draft an outreach email. It goes to the approval queue — it will NOT be sent until the user approves it.",
    "input_schema": {
        "type": "object",
        "properties": {
            "to": {"type": "string"},
            "subject": {"type": "string"},
            "body": {"type": "string"},
            "from_account": {"type": "string"},
            "lead_id": {"type": "string"},
        },
        "required": ["to", "subject", "body", "from_account"],
    },
}

DRAFT_SOCIAL_POST_TOOL = {
    "name": "draft_social_post",
    "description": "Draft a social media post. It goes to the approval queue — it will NOT be posted until the user approves it.",
    "input_schema": {
        "type": "object",
        "properties": {
            "platform": {"type": "string", "enum": ["instagram", "twitter", "tiktok", "linkedin", "facebook"]},
            "content": {"type": "string"},
            "hashtags": {"type": "array", "items": {"type": "string"}},
            "media_description": {"type": "string"},
        },
        "required": ["platform", "content"],
    },
}

ALL_TOOLS = [
    WEB_SEARCH_TOOL,
    CREATE_LEAD_TOOL,
    SEARCH_LEADS_TOOL,
    UPDATE_LEAD_TOOL,
    READ_INBOX_TOOL,
    DRAFT_EMAIL_TOOL,
    DRAFT_SOCIAL_POST_TOOL,
]
