# backend/app/routers/reservas.py

# Define as rotas relacionadas às reservas.
# Usa funções do crud.py e valida os dados com schemas.py.
# Integra segurança para acesso restrito (criar, atualizar, deletar reservas).

# =============================================
# Importações
# =============================================
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlmodel import Session # Importa Session para tipagem da dependência de sessão
from uuid import UUID # Importa UUID para lidar com IDs de usuário (relacionados a reservas)
from typing import List, Optional # Importa para type hints
from datetime import datetime # Importa datetime para filtros de data

# Importações dos seus módulos locais
from app.database import get_session # Dependência para obter sessão do DB
# Importa schemas relevantes para Reserva e Histórico
from app.schemas import ReservaCreate, ReservaRead, ReservaUpdate, ReservaList, HistoricoReservaRead
# Importa dependências de segurança
from app.security import get_current_user, get_current_admin # get_current_user é crucial para saber quem está reservando
# Importa Enums e Modelos relevantes
from app.models import StatusReserva, Reserva, Usuario # Importa StatusReserva e Reserva (para type hints de dependências)

# Importa o módulo CRUD para chamar suas funções de Reserva
import app.crud as crud

# =============================================
# Configuração do Router
# =============================================
# Define as tags para este router. O prefixo (/reservas) será definido no main.py.
router = APIRouter(tags=["reservas"])
# Opcional: Adicionar dependência de segurança padrão aqui já que todas as rotas precisam de autenticação:
# router = APIRouter(prefix="/reservas", tags=["reservas"], dependencies=[Depends(get_current_user)])


# =============================================
# Criar Reserva (Requer Autenticação - Usuário Logado)
# Rota: POST /reservas/
# =============================================
@router.post("/", response_model=ReservaRead, status_code=status.HTTP_201_CREATED)
# Requer que o usuário esteja logado para criar a reserva.
def criar_reserva(
    reserva_create: ReservaCreate, # Dados da reserva (ambiente_id, datas, motivo) vindos do cliente
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user) # <--- Dependência de segurança! Obtém o usuário logado.
):
    """
    Cria uma nova reserva para um ambiente em um período específico.
    Requer autenticação (o usuário logado será associado à reserva).
    Verifica a disponibilidade antes de criar. Status inicial é PENDENTE.
    Lança 409 Conflict se o ambiente não estiver disponível.
    Lança 404 se ambiente_id não existir (se adicionar checagem no CRUD).
    """
    # A dependência get_current_user já garantiu que o usuário está logado e injetou o objeto Usuario.
    # O ID do usuário logado (current_user.id) será passado para a função CRUD.

    # Chama a função CRUD para criar a reserva. O CRUD lida com a disponibilidade e salvamento.
    # Passamos o ID do usuário logado para o CRUD.
    return crud.criar_reserva(reserva_create, session, current_user.id)

# endpoint para listar histórico de reservas (GET /reservas/historico). Restrito a Admin.
@router.get("/historico", response_model=List[HistoricoReservaRead])
# Requer que o usuário logado seja um administrador.
def listar_historico_reservas_endpoint( 
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Usuario = Depends(get_current_admin), # <--- Dependência de segurança! Requer admin logado.
    skip: int = Query(0, description="Número de registros de histórico a pular para paginação"),
    limit: int = Query(100, description="Número máximo de registros de histórico a retornar"),
    # TODO: Adicionar Query parameters para filtros de histórico (usuario_id, ambiente_id, etc.)
    usuario_id: Optional[UUID] = Query(None, description="Filtrar histórico por ID de usuário (apenas para admin)"),
    ambiente_id: Optional[int] = Query(None, description="Filtrar histórico por ID de ambiente"),
    status: Optional[StatusReserva] = Query(None, description="Filtrar histórico por status"),
    # Adicionar filtros de data se necessário, como data_inicio_ge, data_fim_le, etc.
    data_inicio_ge: Optional[datetime] = Query(None, description="Filtrar: data início da reserva >= este valor"),
    data_inicio_le: Optional[datetime] = Query(None, description="Filtrar: data início da reserva <= este valor"),
    data_fim_ge: Optional[datetime] = Query(None, description="Filtrar: data fim da reserva >= este valor"),
    data_fim_le: Optional[datetime] = Query(None, description="Filtrar: data fim da reserva <= este valor"),

):
    """
    Lista todos os registros de histórico de reservas com paginação e filtros.
    Requer autenticação e privilégios de administrador.
    """
    # Chama a função CRUD para obter a lista de histórico de reservas com filtros.
    historico_reservas = crud.obter_historico_reservas(
         session,
         skip=skip,
         limit=limit,
         usuario_id=usuario_id,
         ambiente_id=ambiente_id,
         status=status,
         data_inicio_ge=data_inicio_ge,
         data_inicio_le=data_inicio_le,
         data_fim_ge=data_fim_ge,
         data_fim_le=data_fim_le
    )

    # Retorna a lista de objetos HistoricoReserva.
    return historico_reservas # FastAPI serializará para List[HistoricoReservaRead].

# =============================================
# Obter Reserva por ID 
# Rota: GET /reservas/{reserva_id}
# =============================================
@router.get("/{reserva_id}", response_model=ReservaRead)
def obter_reserva_por_id(
    reserva_id: int, # Path parameter: ID da reserva
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user) # <--- Dependência de segurança! Requer usuário logado para ver detalhes.
    # Adicionar lógica de autorização aqui para que apenas o dono da reserva ou admin possam ver.
    # admin_user: Usuario = Depends(get_current_admin) # Se apenas admin puder ver.
):
    """
    Retorna os dados de uma reserva específica por ID.
    Requer autenticação para ver detalhes completos.
    Lança 404 se a reserva não for encontrada.
    Opcional: Implementar lógica de autorização (dono vs admin).
    """
    # Lógica de Autorização: Permitir que apenas o dono da reserva ou admin veja.
    # reserva = crud.obter_reserva(session, reserva_id) # Busca a reserva primeiro
    # if not reserva.usuario_id == current_user.id and current_user.tipo != TipoUsuario.admin:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado. Você só pode ver suas próprias reservas ou precisa ser admin.")
    # return reserva # Retorna a reserva já buscada

    # Chama a função CRUD para buscar a reserva pelo ID (ela já carrega relacionamentos e trata 404).
    reserva = crud.obter_reserva(session, reserva_id)

    # Se chegou aqui, a reserva foi encontrada e a autenticação/autorização (se implementada acima) passou.
    return reserva # FastAPI serializará para ReservaRead.

# =============================================
# Listar Reservas 
# Rota: GET /reservas/
# =============================================
# versão protegida para listar *todas* as reservas (apenas para admin),
# e você pode criar outra rota (ex: GET /reservas/meus ou adicionar filtros aqui) para usuários comuns.
@router.get("/", response_model=List[ReservaRead])
# Requer que o usuário logado seja um administrador para listar TODAS as reservas.
def listar_reservas(
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Usuario = Depends(get_current_admin), # <--- Dependência de segurança! Requer admin logado.
    skip: int = Query(0, description="Número de reservas a pular para paginação"),
    limit: int = Query(100, description="Número máximo de reservas a retornar"),
    # Adicionar Query parameters para filtros (por usuário, ambiente, status, período)
    usuario_id: Optional[UUID] = Query(None, description="Filtrar por ID de usuário (apenas para admin)"),
    ambiente_id: Optional[int] = Query(None, description="Filtrar por ID de ambiente"),
    status: Optional[StatusReserva] = Query(None, description="Filtrar por status"),
    data_inicio_ge: Optional[datetime] = Query(None, description="Filtrar: data início >= este valor"),
    data_inicio_le: Optional[datetime] = Query(None, description="Filtrar: data início <= este valor"),
    data_fim_ge: Optional[datetime] = Query(None, description="Filtrar: data fim >= este valor"),
    data_fim_le: Optional[datetime] = Query(None, description="Filtrar: data fim <= este valor"),
):
    """
    Lista todas as reservas cadastradas com paginação e filtros.
    Requer privilégios de administrador para listar todas.
    (Opcional: Adicione endpoint separado ou lógica para listar reservas do próprio usuário).
    """
    # Lógica de Autorização (já garantida pelo Depends(get_current_admin))
    # Verifica se o usuário admin está tentando filtrar por um usuario_id específico (se for o caso)
    # if usuario_id is not None and admin_user.tipo != TipoUsuario.admin:
    #     # Esta checagem é redundante se a rota já exige admin, mas pode ser útil se a lógica de filtro for mais complexa.
    #     pass # A rota já exige admin.

    # Chama a função CRUD para obter a lista de reservas com filtros.
    reservas = crud.obter_reservas(
        session,
        skip=skip,
        limit=limit,
        usuario_id=usuario_id, # Passa o filtro de usuario_id para o CRUD
        ambiente_id=ambiente_id,
        status=status,
        data_inicio_ge=data_inicio_ge,
        data_inicio_le=data_inicio_le,
        data_fim_ge=data_fim_ge,
        data_fim_le=data_fim_le
    )

    # Retorna a lista de objetos Reserva (com relacionamentos carregados pelo CRUD).
    return reservas # FastAPI serializará para List[ReservaRead].


# PATCH /reservas/{reserva_id} que o usuário comum ou admin pode usar para mudar datas/motivo/ambiente.
@router.patch("/{reserva_id}", response_model=ReservaRead) # mesmo endpoint do PATCH genérico
# Requer autenticação. Pode permitir atualização pelo próprio usuário OU por admin.
def atualizar_reserva_endpoint( # Renomeado para evitar conflito com a função CRUD
    reserva_id: int, # Path parameter: ID da reserva a ser atualizado.
    reserva_update: ReservaUpdate, # Body: Dados para atualização (campos opcionais). Ver schema ReservaUpdate.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user) # Dependência para obter o usuário logado.
):
    """
    Atualiza os dados (datas, motivo, ambiente) de uma reserva específica por ID.
    Requer autenticação. Permitido para o próprio usuário (se PENDENTE) ou admins.
    Lança 404 se a reserva não for encontrada.
    Lança 403 Forbidden se a permissão for negada.
    Lança 409 Conflict se o ambiente não estiver disponível para o novo período.
    """
    # Lógica de Autorização e Verificação de Disponibilidade está DENTRO da função crud.atualizar_reserva.
    # Primeiro, obtemos a reserva existente para passar para a função CRUD.
    # Nota: A função obter_reserva do CRUD já lida com 404, mas se você quer
    # que a lógica de permissão no CRUD seja mais eficiente, pode passar apenas o ID
    # e a função CRUD busca e verifica permissão em uma única operação.
    # No entanto, a estrutura atual (buscar no router e passar a instância) é clara.
    reserva_no_db = crud.obter_reserva(session, reserva_id) # Lança 404 se não existir

    # Chama a função CRUD para realizar a atualização.
    # A função crud.atualizar_reserva lida com permissão, verificação de disponibilidade e o salvamento.
    updated_reserva = crud.atualizar_reserva(session, reserva_no_db, reserva_update, current_user) # Passa o usuário logado para o CRUD

    return updated_reserva # Retorna o objeto Reserva atualizado.


# Usaremos PATCH /{reserva_id}/status e receberemos o novo status no body.
@router.patch("/{reserva_id}/status", response_model=ReservaRead) # Retorna a reserva com status atualizado
# Requer que o usuário logado seja um administrador.
def atualizar_status_reserva_endpoint( # Renomeado para evitar conflito com a função CRUD
    reserva_id: int, # Path parameter: ID da reserva.
    novo_status: StatusReserva = Body(..., embed=True, description="Novo status desejado para a reserva"), # Recebe o novo status no body JSON. Usa Body(embed=True) se for apenas um campo no body.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    admin_user: Usuario = Depends(get_current_admin) # <--- Dependência de segurança! Requer admin logado.
):
    """
    Atualiza o status de uma reserva específica (PENDENTE, CONFIRMADA, CANCELADA, FINALIZADA).
    Requer autenticação e privilégios de administrador.
    Move a reserva para o histórico se o status for FINALIZADA ou CANCELADA.
    Lança 404 se a reserva não for encontrada.
    Lança 403 Forbidden se quem chamar não for admin.
    Lança 400 Bad Request para transições de status inválidas (ex: CANCELADA para CONFIRMADA).
    """
    # A dependência get_current_admin já garantiu que quem chama é admin.

    # Chama a função CRUD para atualizar o status.
    # O CRUD lida com 404, validação de transição de status, atualização, commit e mover para histórico.
    updated_reserva = crud.atualizar_status_reserva(session, reserva_id, novo_status, admin_user) # Passa o usuário admin logado para o CRUD (embora o CRUD não use para auth interna)

    return updated_reserva # Retorna o objeto Reserva atualizado.


# deletar_reserva (DELETE /reservas/{reserva_id}).
@router.delete("/{reserva_id}", response_model=ReservaRead) 
# Requer autenticação. Implemente lógica de permissão (dono se PENDENTE, ou admin).
def deletar_reserva_endpoint( # Renomeado para evitar conflito com a função CRUD
    reserva_id: int, # Path parameter: ID da reserva a ser deletado.
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user) # <--- Dependência de segurança! Requer autenticação.
):
    """
    Deleta uma reserva específica por ID.
    Requer autenticação. Permitido para o próprio usuário (se PENDENTE) ou admins.
    Lança 404 se a reserva não for encontrada.
    Lança 403 Forbidden se a permissão for negada.
    """
    # Lógica de Autorização está DENTRO da função crud.deletar_reserva.

    # Chama a função CRUD para deletar a reserva. Ela busca, verifica permissão e deleta. Trata 404 e 403.
    deleted_reserva = crud.deletar_reserva(session, reserva_id, current_user) # Passa o usuário logado para o CRUD

    # Retorna o objeto deletado.
    return deleted_reserva 


# Nota: A função mover_reserva_para_historico não tem um endpoint API dedicado.
# Ela é chamada internamente pela função atualizar_status_reserva no CRUD.