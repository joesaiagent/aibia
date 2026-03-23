# ✦ aibia — AI Business Intelligence Agent

**aibia** is an open-source AI agent platform built for growing businesses. It automates lead generation, email outreach, and social media marketing — all with a human-in-the-loop approval system so you stay in control.

![aibia](https://img.shields.io/badge/powered%20by-Claude-7c6ff7?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)

🌐 **Live at [aibia.io](https://aibia.io)**

---

## What it does

- **✦ AI Agent** — Give aibia a task in plain English. It searches the web, finds leads, drafts emails, and creates social posts autonomously
- **👥 Lead Management** — Full CRM: find, track, and manage prospects with AI-powered web research
- **📧 Email Outreach** — Agent drafts personalized emails. You approve before anything sends. Integrates with Gmail and Outlook
- **📣 Social Media** — Draft and queue posts for Instagram, X, TikTok, LinkedIn, and Facebook
- **✅ Approval Queue** — Every agent action goes through your review before executing — no surprises
- **📬 Unified Inbox** — Read your Gmail and Outlook inbox directly in the app
- **💬 Chat** — Conversational AI for business advice, strategy, and quick answers
- **▦ Dashboard** — Live stats across leads, approvals, social, and email

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, React Router v7, TanStack Query |
| Backend | Python 3.12+, FastAPI, SQLAlchemy, SQLite |
| AI | Anthropic Claude (claude-opus-4-6) with tool use agent loop |
| Web Search | Tavily API |
| Email | Gmail OAuth + Outlook OAuth (MSAL) |
| Auth | Clerk |
| Deployment | Ubuntu VPS, Nginx, PM2, Let's Encrypt SSL |

---

## Getting Started

### Prerequisites
- Node.js 22+
- Python 3.12+
- API keys: [Anthropic](https://console.anthropic.com), [Tavily](https://tavily.com)

### 1. Clone the repo

```sh
git clone https://github.com/joesaiagent/aibia.git
cd aibia
```

### 2. Set up the backend

```sh
cd backend
python -m venv .venv && source .venv/bin/activate
poetry install --no-root
cp .env.example .env
# Fill in your API keys in .env
uvicorn app.main:app --reload --port 8000
```

### 3. Set up the frontend

```sh
cd frontend
npm install
echo "VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key" > .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

See `backend/.env.example` for all required variables:

| Variable | Description | Get it |
|----------|-------------|--------|
| `ANTHROPIC_API_KEY` | Claude AI | [console.anthropic.com](https://console.anthropic.com) |
| `TAVILY_API_KEY` | Web search for agent | [tavily.com](https://tavily.com) |
| `FERNET_KEY` | Token encryption | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `GOOGLE_CLIENT_ID` | Gmail OAuth | [console.cloud.google.com](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth | [console.cloud.google.com](https://console.cloud.google.com) |

---

## Project Structure

```
aibia/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/              # DB models (Lead, Approval, SocialPost, EmailAccount)
│   │   ├── api/                 # Route handlers
│   │   │   ├── agent.py         # Agent run endpoint (SSE)
│   │   │   ├── leads.py         # Lead CRUD
│   │   │   ├── approvals.py     # Approval queue
│   │   │   ├── email.py         # Gmail/Outlook OAuth + inbox
│   │   │   ├── social.py        # Social posts
│   │   │   └── dashboard.py     # Stats
│   │   ├── agent/
│   │   │   ├── agent_loop.py    # Tool use agent loop (streaming)
│   │   │   ├── agent.py         # Chat streaming
│   │   │   └── tools/           # Tool definitions + handlers
│   │   └── services/
│   │       ├── gmail.py         # Gmail API
│   │       ├── outlook.py       # MS Graph API
│   │       └── smtp.py          # SMTP fallback
│   └── pyproject.toml
└── frontend/
    └── src/
        ├── pages/               # Dashboard, Agent, Leads, Approvals, Social, Inbox, Settings, Chat
        ├── components/
        │   ├── layout/Sidebar   # Navigation sidebar
        │   └── chat/ChatWindow  # Chat UI
        ├── api/                 # Typed API client
        └── types/               # TypeScript interfaces
```

---

## License

MIT — see [LICENSE](LICENSE)

---

Built with ❤️ by [@joesaiagent](https://github.com/joesaiagent)
