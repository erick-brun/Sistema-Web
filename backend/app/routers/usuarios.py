from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from app.database import get_session
from app.models import Usuario
from app.schemas import UsuarioCreate, UsuarioRead
from app.security import hash_password

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

@router.post("/", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
def criar_usuario(usuario: UsuarioCreate, session: Session = Depends(get_session)):
    # Verifica se o e-mail já existe
    usuario_existente = session.exec(select(Usuario).where(Usuario.email == usuario.email)).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já está em uso."
        )
    
    # Hasheia a senha
    usuario.senha = hash_password(usuario.senha)
    
    novo_usuario = Usuario.from_orm(usuario)
    session.add(novo_usuario)
    
    try:
        session.commit()
        session.refresh(novo_usuario)
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar usuário no banco de dados."
        )
    
    return novo_usuario


@router.get("/usuarios/{usuario_id}", response_model=UsuarioRead)
def obter_usuario(usuario_id: str, session: Session = Depends(get_session)):
    usuario = session.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario




