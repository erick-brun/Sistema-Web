# Responsável pela segurança da aplicação.
# Criação e validação de tokens JWT, criptografia de senhas.

# =============================================
# Importações para segurança
# =============================================
import os
from datetime import datetime, timedelta
from uuid import UUID
from typing import Dict # Importação específica para Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session
from passlib.context import CryptContext

from app.database import get_session
from app.models import Usuario, TipoUsuario # Importa o modelo Usuario e o Enum TipoUsuario

# =============================================
# Hash de Senhas com Bcrypt
# =============================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(senha: str) -> str:
    """Gera um hash seguro da senha do usuário"""
    return pwd_context.hash(senha)

def verify_password(senha_plain: str, senha_hash: str) -> bool:
    """Verifica se a senha em texto corresponde ao hash armazenado"""
    return pwd_context.verify(senha_plain, senha_hash)

# =============================================
# Configurações do JWT
# =============================================
# Lê a chave secreta da variável de ambiente SECRET_KEY.
# ESSENCIAL: Esta chave deve ser forte, secreta e NÃO compartilhada.
# Gerada no seu .env na raiz e passada para o contêiner backend.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # É crucial que a aplicação falhe se a SECRET_KEY não estiver definida.
    # Em ambiente de produção, isso evita rodar a aplicação sem segurança JWT.
    raise ValueError("SECRET_KEY não definida no ambiente do contêiner.")

ALGORITHM = "HS256" # Algoritmo de assinatura comum e seguro
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 # Tempo de validade do access token em minutos
# REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # Tempo de validade do refresh token em dias

def create_access_token(data: Dict, expires_delta: timedelta = None) -> str:
    """
    Cria um token JWT com tempo de expiração.

    Args:
        data: Payload a ser incluído no token. Deve conter o 'sub' (subject, geralmente ID do usuário).
        expires_delta: Duração da validade. Se None, usa ACCESS_TOKEN_EXPIRE_MINUTES.

    Returns:
        O token JWT codificado como string.
    """
    to_encode = data.copy()
    # Define o tempo de expiração
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    # Adiciona a claim 'exp' (expiration time) ao payload
    to_encode.update({"exp": expire})
    # Codifica o token usando a chave secreta e o algoritmo
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# def create_refresh_token(data: Dict) -> str:
#     """
#     Cria um token de atualização com validade maior.
#     (Note: Esta é uma implementação simples. Refresh tokens robustos geralmente envolvem armazenamento em banco de dados.)

#     Args:
#         data: Payload para o token.

#     Returns:
#         O token refresh codificado como string.
#     """
#     expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
#     return create_access_token(data, expires)

def verify_token(token: str) -> Dict:
    """
    Valida e decodifica um token JWT.

    Args:
        token: O token JWT a ser validado e decodificado.

    Returns:
        O payload do token decodificado (como um dicionário).

    Raises:
        HTTPException: Se o token for inválido, expirado ou houver erro de decodificação.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Tenta decodificar o token usando a chave secreta e o algoritmo
        # Isso também valida a assinatura e a expiração automaticamente
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload # Retorna o payload se a decodificação for bem-sucedida
    except JWTError:
        # Captura qualquer erro relacionado ao JWT (assinatura inválida, token expirado, etc.)
        raise credentials_exception # Levanta a exceção de credenciais inválidas

# =============================================
# Autenticação OAuth2 com Dependências FastAPI
# =============================================
# Configura o esquema OAuth2 para autenticação baseada em token Bearer.
# tokenUrl aponta para o endpoint de login onde o cliente obtém o token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login") 

def get_current_user(
    token: str = Depends(oauth2_scheme), # Injete o token do header Authorization
    session: Session = Depends(get_session) # Injete a sessão do banco de dados
) -> Usuario:
    """
    Obtém o usuário autenticado a partir do token JWT.
    Decodifica o token, extrai o ID do usuário ('sub'), e busca o usuário no banco.

    Args:
        token: O token JWT injetado pelo esquema OAuth2.
        session: A sessão do banco de dados injetada.

    Returns:
        A instância do modelo Usuario correspondente ao ID no token.

    Raises:
        HTTPException: Se o token for inválido, o payload não tiver o ID do usuário,
                       ou o usuário não for encontrado no banco.
    """
    # Define a exceção padrão para credenciais inválidas
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decodifica e valida o token usando a função refatorada verify_token
        payload = verify_token(token) # verify_token já lança HTTPException em caso de erro JWT

        # Extrai o ID do usuário (subject) do payload
        user_id_str = payload.get("sub")
        if user_id_str is None:
            # Se a claim 'sub' estiver faltando no token
            raise credentials_exception
            
        # Converte a string do ID para o tipo UUID (pode levantar ValueError)
        user_id = UUID(user_id_str)

    except (HTTPException, ValueError) as e:
        # Captura a HTTPException levantada por verify_token OU ValueError da conversão para UUID
        # Log (opcional): logging.error(f"Erro ao obter usuário do token: {e}")
        raise credentials_exception from e # Relança como a exceção de credenciais padrão

    # Busca o usuário no banco de dados usando o ID extraído
    usuario = session.get(Usuario, user_id)
    if usuario is None:
        # Se o usuário com o ID do token não for encontrado no banco
        raise credentials_exception

    # Retorna a instância do usuário autenticado
    return usuario

def get_current_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Garante que o usuário autenticado (obtido por get_current_user) seja um administrador.

    Args:
        user: A instância do usuário obtida pela dependência get_current_user.

    Returns:
        A instância do usuário (se for admin).

    Raises:
        HTTPException: Se o usuário não tiver o tipo 'admin'.
    """
    if user.tipo != TipoUsuario.admin:
        # Se o tipo do usuário não for 'admin', nega o acesso.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, # Status Code 403: Proibido
            detail="Acesso negado: requer nível administrador."
        )
    return user # Retorna o usuário (confirmado como admin)