from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
import uuid

# Novo enum: apenas user e admin
class TipoUsuario(str, Enum):
    user = "user"
    admin = "admin"

class Usuario(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    nome: str
    email: str = Field(unique=True, index=True)
    senha: str
    tipo: TipoUsuario = Field(default=TipoUsuario.user)  # padrão: user
