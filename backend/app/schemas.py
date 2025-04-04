from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from enum import Enum

# class ReservaCreate(BaseModel):
#     sala: str
#     data: str
#     horario: str
#     professor: str

# Enum para tipos de usuário
class TipoUsuario(str, Enum):
    professor = "professor"
    tecnico = "tecnico"
    inspetor = "inspetor"

# Classe base para evitar repetição
class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    tipo: TipoUsuario

# Base para criação
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    tipo: TipoUsuario

# Base para leitura (resposta sem a senha)
class UsuarioRead(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    tipo: TipoUsuario

    class Config:
        from_attributes = True  # Para suportar ORM
