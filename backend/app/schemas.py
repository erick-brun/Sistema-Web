from pydantic import BaseModel, EmailStr
from uuid import UUID
from enum import Enum

# Enum para tipos de usuário
class TipoUsuario(str, Enum):
    user = "user"
    admin = "admin"

# Base comum
class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr

# Base para criação
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str

# Base para leitura (resposta sem a senha)
class UsuarioRead(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    tipo: TipoUsuario

    class Config:
        from_attributes = True  # Para suportar ORM
