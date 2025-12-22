import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header, HTTPException

cred = credentials.Certificate("firebase_admin.json")
firebase_admin.initialize_app(cred)

def verify_firebase_token(authorization: str = Header(...)):
    try:
        decoded = auth.verify_id_token(authorization)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
