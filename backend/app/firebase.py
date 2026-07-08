from functools import lru_cache

import firebase_admin
from firebase_admin import auth, firestore

from app.config import get_settings


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    """Initializes the Firebase Admin app once per process.

    Uses Application Default Credentials: on Cloud Run this is the
    service account attached to the service (no key file needed); locally
    it's whatever `gcloud auth application-default login` or
    GOOGLE_APPLICATION_CREDENTIALS points to.
    """
    settings = get_settings()
    return firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})


def get_firestore_client():
    get_firebase_app()
    return firestore.client()


def get_auth_client():
    get_firebase_app()
    return auth
