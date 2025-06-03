# Define as rotas relacionadas aos usuários (ex: login, cadastro, perfil).
# Usa funções do crud.py e valida os dados com schemas.py.
# Integra segurança com dependências de autenticação e autorização.

# =============================================
# Importações
# =============================================
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlmodel import Session # Importa Session para tipagem da dependência de sessão
from fastapi.security import OAuth2PasswordRequestForm # Schema padrão para form login
from uuid import UUID # Importa UUID para tipagem de IDs
from typing import List # Importa List para schemas de listagem

# Importações dos seus módulos locais
from app.database import get_session # Dependência para obter sessão do DB
# Importa schemas relevantes 
from app.schemas import UsuarioCreate, UsuarioRead, Token, UsuarioUpdate, UsuarioList
# Importa funções de segurança e dependências
from app.security import (
    create_access_token,
    get_current_user, # Dependência para obter o usuário logado (Autenticação JWT)
    get_current_admin # Dependência para obter o usuário admin logado (Autenticação e Autorização)
)
import app.crud as crud # Importa o módulo CRUD como 'crud' para chamar suas funções
from app.models import Usuario, TipoUsuario # Importa modelos (útil para tipagem de dependências como get_current_user/admin)

# =============================================
# Configuração do Router
# =============================================
# Define apenas as tags para este router.
# O prefixo da URL (/usuarios) será definido no main.py ao incluir este router.
router = APIRouter(tags=["usuarios"])

# =============================================
# Criar Usuário (Acesso Público)
# Rota: POST / (dentro deste router) -> /usuarios/ (URL final)
# =============================================
@router.post("/", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
# Esta rota é pública, não precisa de dependências de segurança no header/token.
def criar_usuario(
    usuario_create: UsuarioCreate, # Dados de entrada validados pelo schema
    session: Session = Depends(get_session) # Dependência da sessão do DB
):
    """
    Cria um novo usuário no sistema com privilégios padrão (user).
    Espera um objeto no corpo da requisição validado pelo schema UsuarioCreate.
    Retorna os dados do usuário criado (excluindo a senha hash).
    Lança 400 se o email já estiver em uso.
    """
    # Chama a função CRUD para criar o usuário. O CRUD lida com a lógica e erros.
    return crud.criar_usuario(usuario_create, session)

# =============================================
# Login (Acesso Público)
# Rota: POST /login (dentro deste router) -> /usuarios/login (URL final)
# =============================================
@router.post("/login", response_model=Token) # Define o schema de resposta (Token)
# Esta rota é pública, não precisa de dependências de segurança.
# A dependência OAuth2PasswordRequestForm lida com os dados de entrada do formulário.
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), # Dependência para obter email/senha do form (espera 'username' e 'password')
    session: Session = Depends(get_session) # Dependência da sessão do DB
):
    """
    Autentica um usuário com email e senha fornecidos em um formulário.
    Em caso de sucesso, retorna um token de acesso JWT.
    Lança 401 Unauthorized se as credenciais forem inválidas.
    """
    # Chama a função CRUD para autenticar o usuário. Ela retorna Usuario ou None.
    # form_data.username contém o email, form_data.password contém a senha.
    usuario = crud.autenticar_usuario(session, form_data.username, form_data.password)

    # Se a autenticação falhou (retornou None), levanta HTTPException 401.
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"}, # Header necessário para o tipo de autenticação OAuth2
        )

    # Se autenticado com sucesso, cria o token de acesso.
    # O payload do token deve conter o 'sub' (subject), que aqui é o ID do usuário (como string).
    access_token = create_access_token(data={"sub": str(usuario.id)})

    # Opcional: Se também precisar de refresh tokens, crie aqui
    # refresh_token = create_refresh_token(data={"sub": str(usuario.id)})

    # Retorna o token de acesso (e refresh token opcional) no formato do schema Token.
    # O response_model=Token garante a formatação correta.
    return Token(access_token=access_token, token_type="bearer")
    # Se usar refresh token: return Token(access_token=access_token, token_type="bearer", refresh_token=refresh_token)

# =============================================
# Perfil do Usuário Logado (Acesso Protegido - Requer Autenticação)
# Rota: GET /me (dentro deste router) -> /usuarios/me (URL final)
# =============================================
@router.get("/me", response_model=UsuarioRead) # Rota /me (dentro deste router)
# Esta rota requer que o usuário esteja logado. A dependência get_current_user cuidará disso.
# O cadeado aparecerá automaticamente.
def ler_meu_perfil(
    usuario: Usuario = Depends(get_current_user) # <--- Dependência de segurança! Injeta o usuário autenticado.
):
    """
    Retorna os dados do usuário autenticado (o próprio perfil).
    Requer autenticação com token JWT válido.
    """
    # A dependência get_current_user já buscou o usuário no DB e garantiu que o token é válido.
    # Simplesmente retorna o objeto Usuario retornado pela dependência.
    return usuario # FastAPI serializará para UsuarioRead.

# =============================================
# Obter Usuário por ID (Acesso Protegido - Requer Autenticação)
# Rota: GET /{usuario_id} (dentro deste router) -> /usuarios/{usuario_id} (URL final)
# =============================================
@router.get("/{usuario_id}", response_model=UsuarioRead)
# Esta rota requer autenticação. A dependência get_current_user cuidará disso.
def obter_usuario_por_id(
    usuario_id: UUID, # Path parameter: UUID do usuário a ser buscado. FastAPI/Pydantic converterá a string do URL para UUID.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user) # <--- Dependência de segurança! Obtém o usuário logado (requer token).
):
    """
    Retorna os dados de um usuário específico por ID (UUID).
    Requer autenticação (usuário logado).
    Lança 404 se o usuário não for encontrado.
    Opcional: Implemente lógica de autorização aqui se apenas admins ou o próprio usuário puderem ver este perfil.
    Lança 403 Forbidden se a lógica de autorização falhar.
    """
    # Lógica de Autorização: Permitir que apenas admins OU o próprio usuário vejam este perfil.
    if current_user.tipo != TipoUsuario.admin and str(current_user.id) != str(usuario_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado. Você só pode ver seu próprio perfil ou precisa ser admin.")

    # Chama a função CRUD para buscar o usuário pelo ID. O CRUD lida com o erro 404.
    usuario = crud.obter_usuario(session, usuario_id)

    # Se chegou aqui, o usuário foi encontrado e a autenticação/autorização (se implementada) passou.
    return usuario # FastAPI serializará para UsuarioRead.

# =============================================
# Promover Usuário a Admin (Acesso Protegido - Requer Admin)
# Rota: PATCH /{usuario_id}/promover 
# =============================================
@router.patch("/{usuario_id}/promover", response_model=UsuarioRead)
# Esta rota requer que o usuário logado seja um administrador. A dependência get_current_admin cuidará disso.
# O cadeado aparecerá automaticamente.
def promover_usuario(
    usuario_id: UUID, # Path parameter: UUID do usuário a ser promovido.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Usuario = Depends(get_current_admin) # <--- Dependência de segurança! Requer admin logado.
):
    """
    Permite que um usuário com privilégios de administrador promova outro usuário para admin.
    Requer autenticação e privilégios de administrador.
    Lança 404 se o usuário a ser promovido não for encontrado.
    Lança 403 Forbidden se quem chamar não for admin.
    """
    # A dependência get_current_admin já garantiu que quem chama é admin (lança 403 se não for).

    # Chama a função CRUD para promover o usuário. Ela busca, atualiza e salva.
    # A função também trata o erro 404 se o usuário a ser promovido não for encontrado.
    promovido = crud.promover_usuario_admin(session, usuario_id)

    # Retorna o objeto do usuário promovido.
    return promovido


# =============================================
# Rebaixar Admin para Usuário (Acesso Restrito a Admin)
# Vamos usar /usuarios/{usuario_id}/rebaixar
# =============================================
@router.patch("/{usuario_id}/rebaixar", response_model=UsuarioRead) # Use response_model=UsuarioRead para retornar o usuário atualizado
# Requer que o usuário logado seja um administrador.
def rebaixar_usuario_endpoint( # Nome do endpoint
    usuario_id: UUID, # Path parameter: UUID do usuário a ser rebaixado.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Usuario = Depends(get_current_admin) # <--- Dependência de segurança! Requer admin logado.
):
    """
    Rebaixa um usuário com privilégios de administrador para o tipo 'user'.
    Requer autenticação e privilégios de administrador.
    Lança 404 se o usuário não for encontrado.
    Lança 403 Forbidden se quem chamar não for admin.
    Lança 400 Bad Request se o usuário a ser rebaixado não for admin.
    Opcional: Impedir que um admin rebaixe a si mesmo (lógica no CRUD ou aqui).
    """
    # A dependência get_current_admin já garantiu que quem chama é admin.

    # Lógica Opcional: Impedir que um admin rebaixe a si mesmo.
    # if str(usuario_id) == str(admin_user.id):
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode rebaixar a si mesmo.")

    # Chama a função CRUD para rebaixar o usuário.
    # crud.rebaixar_admin_para_usuario busca o usuário, verifica se ele é admin, atualiza o tipo e commita.
    # Ela trata o erro 404 (não encontrado) e 400 (não é admin).
    rebaixado = crud.rebaixar_admin_para_usuario(session, usuario_id) # Passa o ID para o CRUD

    # Retorna o objeto do usuário rebaixado, que será serializado pelo response_model.
    return rebaixado


# =============================================
# Atualizar Usuário (Acesso Protegido - Para o Próprio Usuário OU Admin)
# Rota: PATCH /{usuario_id} (dentro deste router) -> /usuarios/{usuario_id} (URL final)
# =============================================
@router.patch("/{usuario_id}", response_model=UsuarioRead)
# Requer autenticação. Dependência get_current_user cuidará disso.
# Implemente lógica de autorização interna.
def atualizar_usuario(
    usuario_id: UUID, # Path parameter: UUID do usuário a ser atualizado.
    usuario_update: UsuarioUpdate, # Body: Dados para atualização (campos opcionais). Ver schema UsuarioUpdate.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user) # <--- Dependência de segurança! Obtém o usuário logado.
):
    """
    Atualiza os dados de um usuário específico por ID.
    Requer autenticação. Implemente lógica de autorização para permitir apenas o próprio usuário ou admins.
    Lança 404 se o usuário não for encontrado.
    Lança 403 Forbidden se a lógica de autorização falhar.
    """
    # Lógica de Autorização: Permitir atualização apenas pelo próprio usuário OU por um admin.
    if current_user.tipo != TipoUsuario.admin and str(current_user.id) != str(usuario_id):
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado. Você só pode atualizar seu próprio perfil ou precisa ser admin.")

    # Busca o usuário a ser atualizado (a função CRUD já lida com 404).
    usuario_no_db = crud.obter_usuario(session, usuario_id) # Retorna Usuario ou lança 404

    # Chama a função CRUD para realizar a atualização. Ela aplica os dados e salva.
    updated_usuario = crud.atualizar_usuario(session, usuario_no_db, usuario_update)

    return updated_usuario # Retorna o objeto Usuario atualizado.


# =============================================
# Deletar Usuário (Acesso Protegido - Requer Admin)
# Rota: DELETE /{usuario_id} (dentro deste router) -> /usuarios/{usuario_id} (URL final)
# =============================================
@router.delete("/{usuario_id}", response_model=UsuarioRead) # Retorna o objeto deletado ou uma mensagem de sucesso
# Requer que o usuário logado seja um administrador. Dependência get_current_admin cuidará disso.
def deletar_usuario(
    usuario_id: UUID, # Path parameter: UUID do usuário a ser deletado.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Usuario = Depends(get_current_admin) # <--- Dependência de segurança! Requer admin logado.
):
    """
    Deleta um usuário específico por ID.
    Requer autenticação e privilégios de administrador.
    Lança 404 se o usuário não for encontrado.
    Lança 403 Forbidden se quem chamar não for admin.
    """
    # A dependência get_current_admin já garantiu que quem chama é admin.

    # Chama a função CRUD para deletar o usuário. Ela busca, deleta e commita. Trata 404.
    deleted_usuario = crud.deletar_usuario(session, usuario_id)

    # Retorna o objeto deletado.
    return deleted_usuario # Ou retorne um dict de sucesso se preferir, mas response_model é UsuarioRead.


# =============================================
# Refresh Token (Acesso Público - Token no Body)
# Rota: POST /refresh (dentro deste router) -> /usuarios/refresh (URL final)
# =============================================
# @router.post("/refresh", response_model=Token) # Define o schema de resposta (Token)
# # Esta rota é pública. O token refresh vem no corpo da requisição, não no header Authorization padrão.
# def refresh_token_endpoint(refresh_token: str = Body(..., embed=True)): # refresh_token é um campo no body JSON
#     """
#     Gera um novo token de acesso a partir de um refresh token válido fornecido no corpo da requisição.
#     Lança 401 Unauthorized se o token for inválido, expirado ou malformado.
#     """
#     # verify_token valida a assinatura, expiração e levanta HTTPException 401 se falhar.
#     payload = verify_token(refresh_token)

#     # Verifica se o payload contém a claim 'sub' (ID do usuário).
#     user_id_str = payload.get("sub")
#     if user_id_str is None:
#          raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token refresh inválido (subject ausente).")

#     # Cria um novo token de acesso com o mesmo 'sub'.
#     new_access_token = create_access_token(data={"sub": user_id_str})

#     # Retorna o novo token de acesso no formato do schema Token.
#     return Token(access_token=new_access_token, token_type="bearer")


# =============================================
# Listar Usuários (Acesso Protegido - Requer Admin)
# Se você também tiver uma rota GET "/" na raiz do seu router (sem parâmetros),
# pode haver conflito dependendo da ordem de definição.
# Mas neste código GET "/" é apenas para listar usuários.
# =============================================
@router.get("/", response_model=List[UsuarioRead]) # Rota: GET / (dentro deste router) -> /usuarios/ (URL final)
def listar_usuarios(
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Usuario = Depends(get_current_admin), # <--- Dependência de segurança! Requer admin logado.
    skip: int = 0, # Query parameter opcional para paginação (padrão 0)
    limit: int = 100 # Query parameter opcional para paginação (padrão 100)
):
    """
    Lista todos os usuários cadastrados com paginação.
    Requer autenticação e privilégios de administrador.
    """
    # Chama a função CRUD para obter a lista de usuários com paginação.
    usuarios = crud.obter_usuarios(session, skip=skip, limit=limit)

    # Retorna a lista de objetos Usuario, que será serializada para List[UsuarioRead].
    return usuarios