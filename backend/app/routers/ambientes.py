# backend/app/routers/ambientes.py

# Define as rotas relacionadas aos ambientes.
# Usa funções do crud.py e valida os dados com schemas.py.
# Integra segurança para acesso restrito 

# =============================================
# Importações
# =============================================
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session # Importa Session para tipagem da dependência de sessão
from uuid import UUID # Pode não ser necessário para ambientes, mas importado para consistência
from typing import List, Optional # Importa para type hints

# Importações dos seus módulos locais
from app.database import get_session # Dependência para obter sessão do DB
# Importa schemas relevantes para Ambiente
from app.schemas import AmbienteCreate, AmbienteRead, AmbienteUpdate, AmbienteList
# Importa dependências de segurança (gerenciamento de ambientes é tipicamente para admin)
from app.security import get_current_user, get_current_admin
# Importa o enum TipoAmbiente para uso nos query parameters (filtragem)
from app.models import TipoAmbiente, Ambiente, Usuario # Importa TipoAmbiente e Ambiente (para type hints de dependências)

# Importa o módulo CRUD para chamar suas funções de Ambiente
import app.crud as crud

# =============================================
# Configuração do Router
# =============================================
# Define as tags para este router. O prefixo (/ambientes) será definido no main.py.
router = APIRouter(tags=["ambientes"])
# Alternativa: router = APIRouter(prefix="/ambientes", tags=["ambientes"], dependencies=[Depends(get_current_admin)])
# Se usar a linha acima, todas as rotas abaixo serão restritas a admin por padrão (exceto se sobrescrito).

# =============================================
# Criar Ambiente (Restrito a Admin)
# Rota: POST /ambientes/ 
# =============================================
@router.post("/", response_model=AmbienteRead, status_code=status.HTTP_201_CREATED)
# Requer que o usuário logado seja um administrador.
def criar_ambiente(
    ambiente_create: AmbienteCreate, # Dados de entrada validados pelo schema
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Ambiente = Depends(get_current_admin) # <--- Dependência de segurança! Requer admin logado.
):
    """
    Cria um novo ambiente no sistema.
    Requer autenticação e privilégios de administrador.
    """
    # A dependência get_current_admin já garantiu que quem chama é admin (lança 403 se não for).

    # Chama a função CRUD para criar o ambiente.
    return crud.criar_ambiente(ambiente_create, session)

# =============================================
# Listar Ambientes 
# Rota: GET /ambientes/
# =============================================
@router.get("/", response_model=List[AmbienteRead])
def listar_ambientes(
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user),
    skip: int = Query(0, description="Número de ambientes a pular para paginação"), # Query parameter opcional para paginação
    limit: int = Query(100, description="Número máximo de ambientes a retornar"), # Query parameter opcional para paginação
    tipo: Optional[TipoAmbiente] = Query(None, description="Filtrar por tipo de ambiente"), # Query parameter opcional para filtrar por tipo
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo (true/false)"), # Query parameter opcional para filtrar por ativo
):
    """
    Lista todos os ambientes cadastrados com paginação e filtros opcionais.
    Geralmente acesso público para visualizar ambientes disponíveis.
    """
    # Chama a função CRUD para obter a lista de ambientes com filtros.
    ambientes = crud.obter_ambientes(session, skip=skip, limit=limit, tipo=tipo, ativo=ativo)

    # Retorna a lista de objetos Ambiente, que será serializada para List[AmbienteRead].
    return ambientes


# =============================================
# Obter Ambiente por ID 
# Rota: GET /ambientes/{ambiente_id}
# =============================================
@router.get("/{ambiente_id}", response_model=AmbienteRead)
def obter_ambiente_por_id(
    ambiente_id: int, # Path parameter: ID do ambiente
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user)
):
    """
    Retorna os dados de um ambiente específico por ID.
    Geralmente acesso público.
    Lança 404 se o ambiente não for encontrado.
    """
    # Chama a função CRUD para buscar o ambiente pelo ID. O CRUD lida com o erro 404.
    ambiente = crud.obter_ambiente(session, ambiente_id)

    # Retorna o objeto Ambiente, que será serializado para AmbienteRead.
    return ambiente

# =============================================
# Atualizar Ambiente (Restrito a Admin)
# Rota: PATCH /ambientes/{ambiente_id}
# =============================================
@router.patch("/{ambiente_id}", response_model=AmbienteRead)
# Requer que o usuário logado seja um administrador.
def atualizar_ambiente(
    ambiente_id: int, # Path parameter: ID do ambiente a ser atualizado
    ambiente_update: AmbienteUpdate, # Body: Dados para atualização (campos opcionais)
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Ambiente = Depends(get_current_admin) # <--- Dependência de segurança! Requer admin logado.
):
    """
    Atualiza os dados de um ambiente específico por ID.
    Requer autenticação e privilégios de administrador.
    Lança 404 se o ambiente não for encontrado.
    """
    # A dependência get_current_admin já garantiu que quem chama é admin.

    # Busca o ambiente a ser atualizado (a função CRUD já lida com 404).
    ambiente_no_db = crud.obter_ambiente(session, ambiente_id) # Retorna Ambiente ou lança 404

    # Chama a função CRUD para realizar a atualização.
    updated_ambiente = crud.atualizar_ambiente(session, ambiente_no_db, ambiente_update)

    return updated_ambiente

# =============================================
# Deletar Ambiente (Restrito a Admin)
# Rota: DELETE /ambientes/{ambiente_id}
# =============================================
@router.delete("/{ambiente_id}", response_model=AmbienteRead) # Retorna o objeto deletado ou uma mensagem de sucesso
# Requer que o usuário logado seja um administrador.
def deletar_ambiente(
    ambiente_id: int, # Path parameter: ID do ambiente a ser deletado.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Ambiente = Depends(get_current_admin) # <--- Dependência de segurança! Requer admin logado.
):
    """
    Deleta um ambiente específico por ID.
    Requer autenticação e privilégios de administrador.
    Lança 404 se o ambiente não for encontrado.
    """
    # A dependência get_current_admin já garantiu que quem chama é admin.

    # Chama a função CRUD para deletar o ambiente. Ela busca, deleta e commita. Trata 404.
    deleted_ambiente = crud.deletar_ambiente(session, ambiente_id)

    # Retorna o objeto deletado.
    return deleted_ambiente

# ... (outras rotas específicas para Ambiente, se necessário, por exemplo, para listar apenas ambientes ativos, etc.) ... 