from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from app.models import Usuario, TipoUsuario
from app.schemas import UsuarioCreate
from app.security import hash_password
from fastapi import HTTPException, status

def criar_usuario(usuario: UsuarioCreate, session: Session) -> Usuario:
    """Cria um novo usuário como 'user' por padrão."""
    usuario_existente = session.exec(select(Usuario).where(Usuario.email == usuario.email)).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já está em uso."
        )
    
    hashed = hash_password(usuario.senha)
    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha=hashed,
        tipo=TipoUsuario.user  # força tipo user
    )

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
