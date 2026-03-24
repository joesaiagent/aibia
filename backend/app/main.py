from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base
from app.api.routes import router as chat_router
from app.api.agent import router as agent_router
from app.api.leads import router as leads_router
from app.api.approvals import router as approvals_router
from app.api.social import router as social_router
from app.api.email import router as email_router
from app.api.dashboard import router as dashboard_router
from app.api.contact import router as contact_router
from app.api.stripe_billing import router as stripe_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="aibia", description="AI agent for growing businesses", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(agent_router, prefix="/api/agent")
app.include_router(leads_router, prefix="/api/leads")
app.include_router(approvals_router, prefix="/api/approvals")
app.include_router(social_router, prefix="/api/social")
app.include_router(email_router, prefix="/api/email")
app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(contact_router, prefix="/api")
app.include_router(stripe_router, prefix="/api")
