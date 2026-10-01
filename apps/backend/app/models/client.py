import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    nom: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    telephone: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        unique=True,
        index=True,
    )

    telephone_secondaire: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    mot_de_passe_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    commandes: Mapped[list["Commande"]] = relationship(
        back_populates="client",
        cascade="all, delete-orphan",
    )

    favoris: Mapped[list["Favori"]] = relationship(
        back_populates="client",
        cascade="all, delete-orphan",
    )
    email_verification_tokens: Mapped[
        list["EmailVerificationToken"]
    ] = relationship(
        back_populates="client",
        cascade="all, delete-orphan",
    )