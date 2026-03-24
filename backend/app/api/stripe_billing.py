import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.api.deps import get_user_id
from app.models.user_subscription import UserSubscription

router = APIRouter()


def _stripe():
    stripe.api_key = settings.stripe_secret_key
    return stripe


@router.post("/stripe/checkout")
async def create_checkout_session(user_id: str = Depends(get_user_id)):
    s = _stripe()
    session = s.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        mode="subscription",
        success_url="https://aibia.io?checkout=success",
        cancel_url="https://aibia.io",
        metadata={"clerk_user_id": user_id},
        subscription_data={"metadata": {"clerk_user_id": user_id}},
    )
    return JSONResponse({"url": session.url})


@router.get("/stripe/publishable-key")
async def get_publishable_key():
    return {"publishable_key": settings.stripe_publishable_key}


@router.get("/stripe/subscription/status")
async def subscription_status(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
    if not sub:
        return {"status": "inactive", "plan": None}
    return {"status": sub.status, "plan": sub.plan}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    etype = event["type"]
    data = event["data"]["object"]

    if etype == "checkout.session.completed":
        clerk_user_id = data.get("metadata", {}).get("clerk_user_id", "")
        customer_id = data.get("customer", "")
        subscription_id = data.get("subscription", "")
        if clerk_user_id:
            sub = db.query(UserSubscription).filter(UserSubscription.user_id == clerk_user_id).first()
            if sub:
                sub.stripe_customer_id = customer_id
                sub.stripe_subscription_id = subscription_id
                sub.status = "active"
            else:
                sub = UserSubscription(
                    user_id=clerk_user_id,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    status="active",
                    plan="solo",
                )
                db.add(sub)
            db.commit()

    elif etype == "customer.subscription.updated":
        stripe_status = data.get("status", "")
        clerk_user_id = data.get("metadata", {}).get("clerk_user_id", "")
        sub_id = data.get("id", "")
        sub = db.query(UserSubscription).filter(
            UserSubscription.stripe_subscription_id == sub_id
        ).first()
        if not sub and clerk_user_id:
            sub = db.query(UserSubscription).filter(UserSubscription.user_id == clerk_user_id).first()
        if sub:
            sub.status = stripe_status if stripe_status in ("active", "trialing") else "inactive"
            db.commit()

    elif etype == "customer.subscription.deleted":
        sub_id = data.get("id", "")
        sub = db.query(UserSubscription).filter(
            UserSubscription.stripe_subscription_id == sub_id
        ).first()
        if sub:
            sub.status = "canceled"
            db.commit()

    elif etype == "invoice.payment_failed":
        sub_id = data.get("subscription", "")
        sub = db.query(UserSubscription).filter(
            UserSubscription.stripe_subscription_id == sub_id
        ).first()
        if sub:
            sub.status = "past_due"
            db.commit()

    return {"received": True}
