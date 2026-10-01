import hashlib
import secrets


def generate_verification_token() -> tuple[str, str]:
    """
    Generate a secure email verification token.

    Returns:
        raw_token: Token sent to the user's email.
        token_hash: SHA-256 hash stored in the database.
    """
    raw_token = secrets.token_urlsafe(32)

    token_hash = hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()

    return raw_token, token_hash


def hash_verification_token(raw_token: str) -> str:
    """
    Hash a verification token received from the client.
    """
    return hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()