from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
import uuid

# class Reserva(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     sala: str
#     data: str
#     horario: str
#     professor: str

# Enum para tipos de usuário
class TipoUsuario(str, Enum):
    professor = "professor"
    tecnico = "tecnico"
    inspetor = "inspetor"

class Usuario(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    nome: str
    email: str = Field(unique=True, index=True)
    senha: str  # A senha será armazenada como hash
    tipo: TipoUsuario
