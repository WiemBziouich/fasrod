from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class ClientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom: str
    telephone: str
    telephone_secondaire: str | None = None
    email: EmailStr
