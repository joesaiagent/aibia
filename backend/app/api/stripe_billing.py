import stripe
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.config import settings

router = APIRouter()


@router.post("/stripe/checkout")
async def create_checkout_session():
    stripe.api_key = settings.stripe_secret_key
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        mode="subscription",
        success_url="https://aibia.io?checkout=success",
        cancel_url="https://aibia.io",
    )
    return JSONResponse({"url": session.url})


@router.get("/stripe/publishable-key")
async def get_publishable_key():
    return {"publishable_key": settings.stripe_publishable_key}
