import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..core.config import settings

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY

# Simulation de la base de données des prix des cours.
# En production, ces données viendraient de votre base de données.
COURSE_PRICES = {
    "javascript-moderne": 75000,  # 75,000 GNF
    "react-debutants": 90000,
    "nodejs-express": 85000,
}

class PaymentIntentRequest(BaseModel):
    course_id: str

@router.post("/create-payment-intent")
async def create_payment(request: PaymentIntentRequest):
    """
    Crée une intention de paiement Stripe.
    """
    if not settings.STRIPE_SECRET_KEY or "VOTRE_CLE_SECRETE" in settings.STRIPE_SECRET_KEY:
        return {"error": "La clé API Stripe n'est pas configurée sur le serveur."}

    try:
        course_id = request.course_id
        if course_id not in COURSE_PRICES:
            raise HTTPException(status_code=404, detail="Cours non trouvé")

        amount = COURSE_PRICES[course_id]

        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="gnf",  # Franc Guinéen
            automatic_payment_methods={"enabled": True},
        )

        return {"clientSecret": payment_intent.client_secret}

    except Exception as e:
        print(f"Erreur Stripe: {e}")
        raise HTTPException(status_code=400, detail=str(e))