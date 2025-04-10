from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.schemas import UsuarioCreate, UsuarioRead
from app import crud  # 🔹 Importando o módulo CRUD
from fastapi.security import OAuth2PasswordRequestForm
from app.security import verify_password, create_access_token, get_current_user
from app.models import Usuario


router = APIRouter(prefix="/usuarios", tags=["Usuários"])

@router.post("/", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
def criar_usuario(usuario: UsuarioCreate, session: Session = Depends(get_session)):
    return crud.criar_usuario(usuario, session)  # 🔹 Chamando a função do CRUD

@router.get("/{usuario_id}", response_model=UsuarioRead)
def obter_usuario(usuario_id: str, session: Session = Depends(get_session)):
    return crud.obter_usuario(usuario_id, session)  # 🔹 Chamando a função do CRUD

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    usuario = session.exec(select(Usuario).where(Usuario.email == form_data.username)).first()

    if not usuario or not verify_password(form_data.password, usuario.senha):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = create_access_token({"sub": usuario.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/perfil")
def perfil(usuario: Usuario = Depends(get_current_user)):
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "tipo": usuario.tipo
    }