from __future__ import annotations

from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.db.session import get_session_maker
from app.models.client import Client
from app.security.password import hash_password

EMAIL_ADAPTER = TypeAdapter(EmailStr)
MIN_PASSWORD_LENGTH = 12
MAX_PASSWORD_LENGTH = 128


def _prompt_required(label: str, *, max_length: int) -> str:
    value = input(f"{label}: ").strip()
    if not value:
        raise ValueError(f"{label} is required")
    if len(value) > max_length:
        raise ValueError(f"{label} is too long")
    return value


def _prompt_email() -> str:
    value = _prompt_required("Email", max_length=255).lower()
    try:
        return str(EMAIL_ADAPTER.validate_python(value))
    except ValidationError as exc:
        raise ValueError("Email is invalid") from exc


def _prompt_password() -> str:
    password = getpass("Password (hidden): ")
    confirmation = getpass("Confirm password (hidden): ")
    if len(password) < MIN_PASSWORD_LENGTH or len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(
            f"Password must contain between {MIN_PASSWORD_LENGTH} and {MAX_PASSWORD_LENGTH} characters"
        )
    if password != confirmation:
        raise ValueError("Passwords do not match")
    return password


def provision_first_admin(*, email: str, telephone: str, nom: str, password: str) -> None:
    session = get_session_maker()()
    try:
        with session.begin():
            if session.scalar(select(Client.id).where(Client.is_admin.is_(True))) is not None:
                raise RuntimeError("An admin account already exists; refusing to create another one")

            existing = session.scalar(
                select(Client.id).where(
                    (Client.email == email) | (Client.telephone == telephone)
                )
            )
            if existing is not None:
                raise RuntimeError("A client already uses this email or telephone")

            session.add(
                Client(
                    nom=nom,
                    telephone=telephone,
                    email=email,
                    mot_de_passe_hash=hash_password(password),
                    is_admin=True,
                    email_verified=True,
                )
            )
    except IntegrityError as exc:
        raise RuntimeError("The admin could not be created because the account already exists") from exc
    finally:
        session.close()


def main() -> None:
    try:
        email = _prompt_email()
        telephone = _prompt_required("Telephone", max_length=32)
        nom = _prompt_required("Name", max_length=150)
        password = _prompt_password()
        provision_first_admin(email=email, telephone=telephone, nom=nom, password=password)
    except (RuntimeError, ValueError) as exc:
        raise SystemExit(str(exc)) from exc

    print(f"First admin provisioned for {email}")


if __name__ == "__main__":
    main()
