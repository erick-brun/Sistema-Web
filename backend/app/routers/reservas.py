# backend/app/routers/reservas.py

# Define as rotas relacionadas às reservas.
# Usa funções do crud.py e valida os dados com schemas.py.
# Integra segurança para acesso restrito (criar, atualizar, deletar reservas).

# =============================================
# Importações
# =============================================
# Importações principais do FastAPI - **CORREÇÃO:** Liste todos os elementos necessários explicitamente
from fastapi import (
    APIRouter,      # Para criar o router
    Depends,        # Para injeção de dependências
    HTTPException,  # Para levantar exceções HTTP (como 403)
    status,
    Query,          # Para definir parâmetros de query
    Body            # Para definir parâmetros no corpo da requisição
)
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
from app.models import StatusReserva, Reserva, Usuario, TipoUsuario

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
# Criar Reserva (Requer Autenticação - Usuário Logado. Admin pode reservar para outros.)
# Rota: POST /reservas/
# **MODIFICADO para aceitar parametro 'reservar_para_usuario_id' para admins**
# =============================================
@router.post("/", response_model=ReservaRead, status_code=status.HTTP_201_CREATED)
# Requer que o usuário esteja logado para criar a reserva.
def criar_reserva(
    reserva_create: ReservaCreate, # Dados da reserva (ambiente_id, datas, motivo)
    session: Session = Depends(get_session), # Dependência da sessão do DB
    current_user: Usuario = Depends(get_current_user), # Obtém o usuário logado
    # **ADICIONADO:** Parametro de query opcional para admin reservar para outro
    reservar_para_usuario_id: Optional[UUID] = Query(None, description="ID do usuário para quem a reserva está sendo feita (apenas para admin)")
):
    """
    Cria uma nova reserva para um ambiente em um período específico.
    Requer autenticação. Usuário comum cria para si mesmo. Admin pode criar para si ou para outro.
    Verifica a disponibilidade antes de criar. Status inicial é PENDENTE.
    Lança 409 Conflict se indisponível. Lança 404 se ambiente_id ou reservar_para_usuario_id (se admin) não existir.
    Lança 403 Forbidden se usuário comum tentar usar reservar_para_usuario_id.
    """
    # Determinar qual ID de usuário será associado à reserva.
    user_id_para_reserva: uuid.UUID = current_user.id # Por padrão, usa o ID do usuário logado

    # **Lógica de Autorização para reservar_para_usuario_id:**
    if reservar_para_usuario_id is not None:
        # Se o parâmetro foi fornecido, verificar se o usuário logado é admin.
        if current_user.tipo != TipoUsuario.admin:
            # Se NÃO for admin, nega o acesso.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado. Apenas administradores podem criar reservas para outros usuários."
            )
        else:
            # Se for admin, usar o reservar_para_usuario_id fornecido.
            # Opcional: Verificar se o usuário com esse ID existe.
            usuario_para_reserva = session.get(Usuario, reservar_para_usuario_id)
            if not usuario_para_reserva:
                 raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário para quem reservar não encontrado.")

            user_id_para_reserva = reservar_para_usuario_id # Usa o ID fornecido pelo admin


    # Chama a função CRUD para criar a reserva, passando o ID determinado pela lógica acima.
    # **MODIFICAR CHAMADA CRUD:** Passar user_id_para_reserva como argumento.
    return crud.criar_reserva(reserva_create, session, user_id_para_reserva)


# =============================================
# Listar Histórico de Reservas Pessoais (Acesso Protegido - Usuário Logado)
# Rota: GET /reservas/historico/me
# =============================================
@router.get("/historico/me", response_model=List[HistoricoReservaRead])
# Requer que o usuário esteja logado (qualquer tipo).
def listar_meu_historico_reservas_endpoint( # Novo nome para o endpoint
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user), # <--- Requer usuário logado
    skip: int = Query(0, description="Número de registros de histórico a pular para paginação"),
    limit: int = Query(100, description="Número máximo de registros de histórico a retornar"),
    # Opcional: Adicionar filtros para o histórico pessoal (status, datas...)
    status: Optional[StatusReserva] = Query(None, description="Filtrar histórico pessoal por status"),
    data_inicio_ge: Optional[datetime] = Query(None, description="Filtrar histórico pessoal: data início >= este valor"),
    data_inicio_le: Optional[datetime] = Query(None, description="Filtrar histórico pessoal: data início <= este valor"),
    data_fim_ge: Optional[datetime] = Query(None, description="Filtrar histórico pessoal: data fim >= este valor"),
    data_fim_le: Optional[datetime] = Query(None, description="Filtrar histórico pessoal: data fim <= este valor"),

):
    """
    Lista os registros de histórico de reservas do usuário logado.
    Requer autenticação (usuário logado).
    """
    # Chama a função CRUD para obter o histórico, passando o ID do usuário logado como filtro obrigatório.
    historico_reservas = crud.obter_historico_reservas(
         session,
         skip=skip,
         limit=limit,
         usuario_id=current_user.id, # <--- FORÇA o filtro para o ID do usuário logado
         ambiente_id=None, # Não permite filtrar histórico pessoal por ambiente_id (a menos que adicione como Query)
         status=status,
         data_inicio_ge=data_inicio_ge,
         data_inicio_le=data_inicio_le,
         data_fim_ge=data_fim_ge,
         data_fim_le=data_fim_le
    )

    return historico_reservas

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
# Listar Reservas (Acesso Protegido - Diferentes Permissões para User e Admin)
# Rota: GET /reservas/
# **MODIFICADO para permitir User filtrar apenas por si mesmo, Admin filtrar por qualquer um**
# =============================================
@router.get("/", response_model=List[ReservaRead])
# Requer que o usuário esteja logado (autenticado).
# Usamos get_current_user para obter a identidade do usuário logado, seja ele user ou admin.
def listar_reservas(
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user), # Obtém o usuário logado
    skip: int = Query(0, description="Número de reservas a pular para paginação"),
    limit: int = Query(100, description="Número máximo de reservas a retornar"),
    usuario_id: Optional[UUID] = Query(None, description="Filtrar por ID de usuário (apenas para admin ou o próprio usuário)"),
    ambiente_id: Optional[int] = Query(None, description="Filtrar por ID de ambiente"),
    status: Optional[StatusReserva] = Query(None, description="Filtrar por status"),
    data_inicio_ge: Optional[datetime] = Query(None, description="Filtrar: data início >= este valor"),
    data_inicio_le: Optional[Optional[datetime]] = Query(None, description="Filtrar: data início <= este valor"), # Corrigir Optional aninhado
    data_fim_ge: Optional[datetime] = Query(None, description="Filtrar: data fim >= este valor"),
    data_fim_le: Optional[datetime] = Query(None, description="Filtrar: data fim <= este valor"),
):
    """
    Lista reservas cadastradas com paginação e filtros.
    Requer autenticação (usuário logado).
    Usuário comum pode listar apenas suas próprias reservas (se fornecer usuario_id=seu_id, ou sem filtro).
    Admin pode listar todas ou filtrar por qualquer usuario_id.
    """
    filtro_usuario_id: Optional[UUID] = None # Variável que será usada para filtrar no CRUD

    if current_user.tipo == TipoUsuario.admin:
        # Admin pode usar o filtro usuario_id fornecido na requisição (se houver).
        filtro_usuario_id = usuario_id
    else: # Usuário comum (tipo USER)
        # Usuário comum SÓ pode ver as próprias reservas.
        if usuario_id is not None and usuario_id != current_user.id:
            # Se o USER tentou filtrar por um usuario_id que NÃO é o dele, nega o acesso.
             # **NOTA:** Aqui você levanta 403. Use status.HTTP_403_FORBIDDEN.
             # Se a importação de status ainda estiver com problema, use 403 diretamente.
             raise HTTPException(
                status_code=403, # <--- Verifique a importação de status
                detail="Acesso negado. Você só pode listar suas próprias reservas."
            )
        # Se o USER não forneceu usuario_id OU forneceu o ID dele, o filtro será o ID dele.
        filtro_usuario_id = current_user.id # Força o filtro para o ID do usuário logado.


    # Chama a função CRUD para obter a lista de reservas com os filtros.
    # Passamos o filtro_usuario_id controlado para o CRUD.
    reservas = crud.obter_reservas(
        session,
        skip=skip,
        limit=limit,
        usuario_id=filtro_usuario_id, # <--- Usa o filtro_usuario_id determinado pela lógica de permissão
        ambiente_id=ambiente_id,
        status=status,
        data_inicio_ge=data_inicio_ge,
        data_inicio_le=data_inicio_le,
        data_fim_ge=data_fim_ge,
        data_fim_le=data_fim_le
    )

    return reservas


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

# **MODIFICADO para permitir User comum (dono e PENDENTE) CANCELAR**
@router.patch("/{reserva_id}/status", response_model=ReservaRead)
# **MODIFICADO:** Requer APENAS autenticação (qualquer usuário logado).
# A lógica de permissão (Admin vs User dono) está DENTRO da função CRUD.
def atualizar_status_reserva_endpoint(
    reserva_id: int,
    novo_status: StatusReserva = Body(..., embed=True, description="Novo status desejado para a reserva"),
    session: Session = Depends(get_session),
    # **MODIFICADO:** Usa get_current_user para obter o usuário logado (seja user ou admin)
    current_user: Usuario = Depends(get_current_user) # <--- Usa get_current_user!
):
    """
    Atualiza o status de uma reserva específica (PENDENTE, CONFIRMADA, CANCELADA, FINALIZADA).
    Requer autenticação.
    Permitido para Admin (qualquer status válido) ou Usuário comum (CANCELADA se dono e PENDENTE).
    Lança 404 se a reserva não for encontrada.
    Lança 403 Forbidden se a permissão for negada (lógica no CRUD).
    Lança 400 Bad Request para transições de status inválidas.
    """
    # A lógica de permissão (quem pode ir para qual status) está agora DENTRO da função CRUD.
    # Passamos o usuário logado para o CRUD para que ele verifique as permissões.

    # Chama a função CRUD para atualizar o status. O CRUD lida com TUDO:
    # 404, permissão (403), validação de transição (400), atualização, commit e mover para histórico.
    updated_reserva = crud.atualizar_status_reserva(session, reserva_id, novo_status, current_user) # <--- Passa current_user

    return updated_reserva


# # deletar_reserva (DELETE /reservas/{reserva_id}).
# @router.delete("/{reserva_id}", response_model=ReservaRead) 
# # Requer autenticação. Implemente lógica de permissão (dono se PENDENTE, ou admin).
# def deletar_reserva_endpoint( # Renomeado para evitar conflito com a função CRUD
#     reserva_id: int, # Path parameter: ID da reserva a ser deletado.
#     session: Session = Depends(get_session), # Dependência da sessão do DB
#     current_user: Usuario = Depends(get_current_user) # <--- Dependência de segurança! Requer autenticação.
# ):
#     """
#     Deleta uma reserva específica por ID.
#     Requer autenticação. Permitido para o próprio usuário (se PENDENTE) ou admins.
#     Lança 404 se a reserva não for encontrada.
#     Lança 403 Forbidden se a permissão for negada.
#     """
#     # Lógica de Autorização está DENTRO da função crud.deletar_reserva.

#     # Chama a função CRUD para deletar a reserva. Ela busca, verifica permissão e deleta. Trata 404 e 403.
#     deleted_reserva = crud.deletar_reserva(session, reserva_id, current_user) # Passa o usuário logado para o CRUD

#     # Retorna o objeto deletado.
#     return deleted_reserva 


# Nota: A função mover_reserva_para_historico não tem um endpoint API dedicado.
# Ela é chamada internamente pela função atualizar_status_reserva no CRUD.