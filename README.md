# ✦ aibia — AI Business Assistant

An open source AI agent built for small businesses. Ask about marketing, customers, finances, operations, and more.

![aibia](https://img.shields.io/badge/powered%20by-Claude-7c6ff7?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## Features

- 💬 Conversational AI powered by Claude
- 🗂️ Multi-conversation sidebar with history
- 💡 Suggested prompts to get started quickly
- ⚡ Real-time responses with typing indicator
- 🖥️ Clean desktop UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript (Vite) |
| Backend | Python + FastAPI |
| AI | Anthropic Claude API |
| Package management | Poetry (backend) · npm (frontend) |

## Getting Started

### Prerequisites

- Python 3.14+
- Node.js 24+
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

### 1. Clone the repo

```sh
git clone https://github.com/joesaiagent/aibia.git
cd aibia
```

### 2. Set up the backend

```sh
cd backend
poetry install
cp .env.example .env
# Add your Anthropic API key to .env
```

### 3. Set up the frontend

```sh
cd frontend
npm install
```

### 4. Run the app

In one terminal:
```sh
cd backend
poetry run uvicorn app.main:app --reload
```

In another terminal:
```sh
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
aibia/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── api/routes.py    # API endpoints
│   │   └── agent/
│   │       ├── agent.py     # Claude integration
│   │       └── prompts.py   # System prompt
│   └── pyproject.toml
└── frontend/
    └── src/
        ├── App.tsx          # Main chat UI
        └── App.css          # Styles
```

## License

MIT
