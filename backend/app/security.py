from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlmodel import Session
from app.database import get_session
from app.models import Usuario

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(senha: str) -> str:
    return pwd_context.hash(senha)

# def verificar_senha(senha: str, senha_hash: str) -> bool:
#     return pwd_context.verify(senha, senha_hash)

def verify_password(senha_plain: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_plain, senha_hash)


# Configurações básicas do JWT
SECRET_KEY = "sua_chave_secreta_segura"  # depois coloque isso em uma variável de ambiente
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    usuario = session.get(Usuario, user_id)
    if usuario is None:
        raise credentials_exception
    return usuario
