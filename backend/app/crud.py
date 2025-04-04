from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from app.models import Usuario
from app.schemas import UsuarioCreate
from app.security import hash_password
from fastapi import HTTPException, status

def criar_usuario(usuario: UsuarioCreate, session: Session) -> Usuario:
    """Cria um novo usuário no banco de dados."""
    usuario_existente = session.exec(select(Usuario).where(Usuario.email == usuario.email)).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já está em uso."
        )
    
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

def obter_usuario(usuario_id: str, session: Session) -> Usuario:
    """Obtém um usuário pelo ID."""
    usuario = session.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario
