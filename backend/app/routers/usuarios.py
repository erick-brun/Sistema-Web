from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.database import get_session
from app.schemas import UsuarioCreate, UsuarioRead
from app import crud  # 🔹 Importando o módulo CRUD

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

@router.post("/", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
def criar_usuario(usuario: UsuarioCreate, session: Session = Depends(get_session)):
    return crud.criar_usuario(usuario, session)  # 🔹 Chamando a função do CRUD

@router.get("/{usuario_id}", response_model=UsuarioRead)
def obter_usuario(usuario_id: str, session: Session = Depends(get_session)):
    return crud.obter_usuario(usuario_id, session)  # 🔹 Chamando a função do CRUD
