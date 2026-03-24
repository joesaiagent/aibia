from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    tavily_api_key: str = ""
    fernet_key: str = ""

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/email/oauth/callback"

    microsoft_client_id: str = ""
    microsoft_tenant_id: str = "common"
    microsoft_client_secret: str = ""
    microsoft_redirect_uri: str = "http://localhost:8000/api/email/oauth/callback"

    instagram_app_id: str = ""
    instagram_app_secret: str = ""
    twitter_api_key: str = ""
    twitter_api_secret: str = ""
    twitter_bearer_token: str = ""
    tiktok_client_key: str = ""
    tiktok_client_secret: str = ""
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""
    facebook_app_id: str = ""
    facebook_app_secret: str = ""

    # SMTP (simpler alternative to OAuth — use Gmail app password)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "aibia"

    # Frontend URL for OAuth redirects
    frontend_url: str = "http://localhost:5174"

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_price_id: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
