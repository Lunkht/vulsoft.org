from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pyotp
import qrcode
import io
from starlette.responses import StreamingResponse
from pydantic import BaseModel

from .. import database, security
from ..core.config import settings

router = APIRouter()

class TwoFactorEnableRequest(BaseModel):
    otp_code: str

class TwoFactorDisableRequest(BaseModel):
    password: str

@router.post("/generate")
async def generate_2fa_secret(current_user: database.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    """
    Génère un nouveau secret 2FA et un URI de provisionnement pour l'utilisateur actuel.
    """
    if current_user.is_two_factor_enabled:
        raise HTTPException(status_code=400, detail="La 2FA est déjà activée.")

    secret = pyotp.random_base32()
    current_user.two_factor_secret = secret
    db.commit()

    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name=settings.TWO_FACTOR_ISSUER_NAME
    )

    return {"secret": secret, "provisioning_uri": provisioning_uri}

@router.get("/qr-code")
async def get_qr_code(current_user: database.User = Depends(security.get_current_user)):
    """
    Génère une image QR code pour le secret 2FA de l'utilisateur.
    """
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="Secret 2FA non généré. Veuillez en générer un.")

    provisioning_uri = pyotp.totp.TOTP(current_user.two_factor_secret).provisioning_uri(
        name=current_user.email,
        issuer_name=settings.TWO_FACTOR_ISSUER_NAME
    )

    img = qrcode.make(provisioning_uri)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")

@router.post("/enable")
async def enable_2fa(
    request: TwoFactorEnableRequest,
    current_user: database.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Active la 2FA pour l'utilisateur actuel en vérifiant un code OTP.
    """
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="Aucun secret 2FA trouvé. Veuillez en générer un.")

    if not security.verify_otp(current_user.two_factor_secret, request.otp_code):
        raise HTTPException(status_code=400, detail="Code OTP invalide.")

    current_user.is_two_factor_enabled = True
    db.commit()

    return {"success": True, "message": "La 2FA a été activée avec succès."}

@router.post("/disable")
async def disable_2fa(
    request: TwoFactorDisableRequest,
    current_user: database.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Désactive la 2FA en vérifiant le mot de passe de l'utilisateur."""
    if not security.verify_password(request.password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Mot de passe invalide.")

    current_user.is_two_factor_enabled = False
    current_user.two_factor_secret = None
    db.commit()

    return {"success": True, "message": "La 2FA a été désactivée."}