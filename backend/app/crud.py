# Contém a lógica principal de acesso e manipulação dos dados no banco para os modelos.
# Funções de criação, leitura, atualização, exclusão (CRUD) e operações específicas como login/autenticação.

# =============================================
# Importações
# =============================================
import logging # Importa o módulo de logging padrão do Python
from sqlalchemy.exc import IntegrityError # Importa exceção específica do SQLAlchemy
from sqlmodel import Session, select, and_, or_ # Importa o necessário do SQLModel para consultas
from fastapi import HTTPException, status # Importa exceções HTTP do FastAPI
from typing import List, Optional # Importa tipos para type hints (listas e valores opcionais)
import uuid # Importa uuid para lidar com IDs do tipo UUID
from datetime import datetime, timezone
# Importações dos seus módulos locais
from app.models import Usuario, TipoUsuario, Ambiente, TipoAmbiente, Reserva, StatusReserva, HistoricoReserva # Importa os modelos de dados
# Importa schemas relevantes. UsuarioUpdate será necessário para a função de atualização.
from app.schemas import UsuarioCreate, UsuarioUpdate, AmbienteCreate, AmbienteUpdate, ReservaCreate, ReservaUpdate, HistoricoReservaRead
# Importa funções de segurança para hash e verificação de senhas
from app.security import hash_password, verify_password

# Importações para carregar relacionamentos (útil para ReservaRead)
from sqlalchemy.orm import selectinload # Importe selectinload

# =============================================
# Configuração do Logger 
# =============================================
# Configuração básica para imprimir logs no console.
# Em um ambiente de produção real, configurar para enviar logs para um sistema centralizado.
logging.basicConfig(level=logging.INFO) # Define o nível mínimo de log a ser exibido
logger = logging.getLogger(__name__) # Cria um logger específico para este módulo (app.crud)

# =============================================
# Funções CRUD para Usuário (Usuario)
# =============================================

def criar_usuario(usuario_create: UsuarioCreate, session: Session) -> Usuario:
    """
    Cria um novo usuário no banco de dados com senha hasheada e tipo padrão 'user'.

    Args:
        usuario_create: Um objeto UsuarioCreate contendo os dados do novo usuário (nome, email, senha).
        session: A sessão do banco de dados (injetada via dependência FastAPI).

    Returns:
        A instância do modelo Usuario recém-criado com o ID do banco.

    Raises:
        HTTPException: Se o e-mail já estiver em uso (status 400) ou
                       se ocorrer um erro inesperado ao salvar no banco (status 500).
    """
    # 1. Verifica se o e-mail já está cadastrado para garantir unicidade antes de tentar salvar.
    # Usa .first() pois o campo email tem restrição UNIQUE no modelo, esperamos no máximo um resultado.
    usuario_existente: Optional[Usuario] = session.exec(
        select(Usuario).where(Usuario.email == usuario_create.email)
    ).first()

    if usuario_existente:
        # Se encontrou um usuário com o mesmo e-mail, levanta uma exceção HTTP 400 Bad Request.
        logger.warning(f"Tentativa de criar usuário com email duplicado: {usuario_create.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, # 400: Requisição Inválida
            detail="E-mail já está em uso."
        )

    # 2. Gera hash seguro da senha fornecida no schema de criação.
    senha_hashed: str = hash_password(usuario_create.senha)

    # 3. Cria uma instância do modelo ORM Usuario com os dados e a senha hasheada.
    # O tipo é forçado para 'user' por segurança, impedindo que um usuário comum se cadastre como admin.
    novo_usuario = Usuario(
        nome=usuario_create.nome,
        email=usuario_create.email,
        senha_hash=senha_hashed,
        tipo=TipoUsuario.user,  # Define o tipo padrão (user)
        # Os campos 'ativo' e 'data_criacao' usarão os valores padrão definidos no modelo (True e datetime.now()).
    )

    # 4. Adiciona o novo objeto à sessão e tenta persistir as mudanças no banco.
    session.add(novo_usuario) # Prepara o objeto para ser inserido/salvo
    try:
        session.commit() # Tenta commitar a transação (inserir no DB)
        # Atualiza a instância do objeto Python com quaisquer dados gerados pelo banco (como o ID gerado, se fosse autoincremental).
        # É crucial para ter o objeto completo e atualizado após o commit.
        session.refresh(novo_usuario)
    except IntegrityError as e:
        # Captura erros de integridade do banco que possam ocorrer durante o commit (ex: outra restrição UNIQUE que não o email que não foi checada antes).
        session.rollback() # Desfaz quaisquer operações na sessão em caso de erro para manter o banco consistente.
        logger.error(f"Erro de integridade ao salvar usuário {usuario_create.email}: {e}", exc_info=True) # Loga o erro com traceback.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, # 500: Erro Interno do Servidor
            detail="Ocorreu um erro inesperado ao salvar o usuário."
        )
    except Exception as e:
         # Captura quaisquer outros erros inesperados que possam acontecer durante commit/refresh.
        session.rollback() # Desfaz as operações da sessão.
        logger.error(f"Erro inesperado ao salvar usuário {usuario_create.email}: {e}", exc_info=True) # Loga o erro com traceback.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno no servidor."
        )

    return novo_usuario # Retorna a instância do objeto Usuario criado, incluindo o ID gerado.

def obter_usuario(session: Session, usuario_id: uuid.UUID) -> Usuario:
    """
    Busca um usuário no banco de dados pelo seu ID (UUID).

    Args:
        session: A sessão do banco de dados.
        usuario_id: O UUID do usuário a ser buscado.

    Returns:
        A instância do modelo Usuario correspondente ao ID.

    Raises:
        HTTPException: Se o usuário com o ID fornecido não for encontrado no banco (status 404).
    """
    # session.get() é a forma eficiente de buscar um objeto pela sua chave primária.
    # Ele retorna a instância do objeto ou None se não for encontrado.
    usuario: Optional[Usuario] = session.get(Usuario, usuario_id)

    if not usuario:
        # Se o usuário não foi encontrado, levanta uma exceção HTTP 404 Not Found.
        logger.warning(f"Usuário com ID {usuario_id} não encontrado.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, # 404: Não Encontrado
            detail="Usuário não encontrado."
        )

    return usuario # Retorna a instância do objeto Usuario encontrado.

def obter_usuarios(session: Session, skip: int = 0, limit: int = 100) -> List[Usuario]:
    """
    Retorna uma lista paginada de usuários.

    Args:
        session: A sessão do banco de dados.
        skip: O número de registros a serem pulados (para paginação).
        limit: O número máximo de registros a serem retornados.

    Returns:
        Uma lista de instâncias do modelo Usuario.
    """
    # Cria uma query para selecionar usuários, aplica offset (skip) e limit.
    # Usa .all() para executar a query e obter todos os resultados.
    usuarios: List[Usuario] = session.exec(
        select(Usuario).offset(skip).limit(limit)
    ).all()

    return usuarios # Retorna a lista de objetos Usuario.

def atualizar_usuario(
    session: Session,
    usuario_existente: Usuario, # A instância do usuário já obtida 
    usuario_update: UsuarioUpdate # Os dados de atualização fornecidos pelo usuário (schema de entrada)
) -> Usuario:
    """
    Atualiza os dados de um usuário existente no banco de dados.

    Args:
        session: A sessão do banco de dados.
        usuario_existente: A instância do modelo Usuario que foi recuperada do DB e será atualizada.
        usuario_update: Um objeto UsuarioUpdate com os campos a serem atualizados.
                         Campos com valor None ou que não foram enviados na requisição
                         (excluídos por exclude_unset=True no model_dump) NÃO são atualizados.

    Returns:
        A instância do modelo Usuario atualizada (após o commit e refresh).

    Raises:
         HTTPException: Se ocorrer um erro inesperado ao salvar as mudanças no banco (status 500).
         # Nota: Validação de email único em update requer lógica adicional no CRUD.
    """
    # 1. Converte o schema de atualização (UsuarioUpdate) para um dicionário.
    #    exclude_unset=True garante que apenas os campos que foram explicitamente
    #    definidos na requisição PATCH sejam incluídos neste dicionário.
    update_data = usuario_update.model_dump(exclude_unset=True)

    # 2. Trata a atualização da senha separadamente.
    #    Se o campo 'senha' estiver presente no dicionário de atualização (foi enviado na requisição).
    if "senha" in update_data and update_data["senha"] is not None:
        # Remove a senha em texto puro do dicionário para não salvar no campo errado.
        senha_plain = update_data.pop("senha")
        # Adiciona a senha hasheada ao dicionário com o nome correto do campo no modelo (senha_hash).
        update_data["senha_hash"] = hash_password(senha_plain)

    # 3. Aplica os dados de atualização (do dicionário update_data) à instância do usuário existente.
    #    O método sqlmodel_update (disponível no SQLModel v2+) é a forma idiomática de fazer isso.
    #    Ele itera sobre os itens do dicionário update_data e atualiza os atributos correspondentes
    #    na instância usuario_existente.
    usuario_existente.sqlmodel_update(update_data)


    # 4. Adiciona a instância modificada à sessão.
    #    Mesmo que a instância já esteja na sessão, chamar add() novamente
    #    é uma boa prática para garantir que as mudanças sejam detectadas para o UPDATE.
    session.add(usuario_existente)
    try:
        # 5. Commita a transação para persistir as mudanças no banco (executa o UPDATE).
        session.commit()
        # 6. Atualiza a instância do objeto Python com os dados do banco após o commit.
        #    sqlmodel_update geralmente mantém a instância atualizada, mas refresh é seguro.
        session.refresh(usuario_existente)
    except Exception as e:
        # Em caso de erro inesperado durante o commit, desfaz a transação.
        session.rollback()
        # Loga o erro para diagnóstico, incluindo o traceback.
        logger.error(f"Erro inesperado ao atualizar usuário {usuario_existente.id}: {e}", exc_info=True)
        # Levanta uma HTTPException 500 para o cliente.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno no servidor ao atualizar o usuário."
        )

    # 7. Retorna a instância do usuário atualizada.
    return usuario_existente

def deletar_usuario(session: Session, usuario_id: uuid.UUID) -> Usuario:
    """
    Deleta um usuário do banco de dados pelo seu ID (UUID).

    Args:
        session: A sessão do banco de dados.
        usuario_id: O UUID do usuário a ser deletado.

    Returns:
        A instância do modelo Usuario que foi deletada. (Nota: O objeto estará desanexado/stale após o commit).

    Raises:
        HTTPException: Se o usuário com o ID fornecido não for encontrado (status 404).
    """
    # Primeiro, busca o usuário para garantir que ele existe.
    # Reutiliza a função obter_usuario que já trata o erro 404 se não encontrar.
    usuario = obter_usuario(session, usuario_id) # Este já lança 404 se não existir

    # Se chegou aqui, o usuário foi encontrado. Prepara para deletar.
    session.delete(usuario) # Marca o objeto para ser deletado na próxima transação.
    try:
        session.commit() # Executa o DELETE no banco.
        # Nota: session.refresh(usuario) não é geralmente útil após delete, o objeto está "morto" na sessão.
        # Retornamos o objeto antes do commit para que quem chamou ainda tenha acesso aos seus dados (como ID).
    except Exception as e:
        session.rollback()
        logger.error(f"Erro inesperado ao deletar usuário {usuario_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno no servidor ao deletar o usuário."
        )

    # Retorna a instância do usuário que foi deletada.
    # O objeto pode não ser totalmente útil após o commit, mas confirma a operação.
    return usuario


# =============================================
# Funções CRUD para Ambiente (Ambiente)
# =============================================

def criar_ambiente(ambiente_create: AmbienteCreate, session: Session) -> Ambiente:
    """
    Cria um novo ambiente no banco de dados.

    Args:
        ambiente_create: Um objeto AmbienteCreate contendo os dados do novo ambiente.
        session: A sessão do banco de dados.

    Returns:
        A instância do modelo Ambiente recém-criado com o ID do banco.

    Raises:
        HTTPException: Se ocorrer um erro inesperado ao salvar no banco (status 500).
        # Opcional: Adicionar validação para nome de ambiente único se necessário.
    """
    # 1. Cria uma instância do modelo ORM Ambiente com os dados do schema.
    #    Os campos 'ativo' usará o valor padrão definido no modelo (True).
    novo_ambiente = Ambiente(
        nome=ambiente_create.nome,
        capacidade=ambiente_create.capacidade,
        descricao=ambiente_create.descricao,
        tipo_ambiente=ambiente_create.tipo_ambiente,
        tv=ambiente_create.tv,
        projetor=ambiente_create.projetor,
        ar_condicionado=ambiente_create.ar_condicionado,
        # 'ativo' usará o default=True do modelo
    )
    # Forma alternativa mais curta (Pydantic/SQLModel): novo_ambiente = Ambiente.model_validate(ambiente_create)

    # 2. Adiciona o novo objeto à sessão e tenta persistir as mudanças.
    session.add(novo_ambiente)
    try:
        session.commit()
        session.refresh(novo_ambiente) # Atualiza a instância com o ID gerado pelo banco
    except Exception as e:
         # Captura erros inesperados durante commit/refresh.
        session.rollback()
        logger.error(f"Erro inesperado ao salvar ambiente {ambiente_create.nome}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno no servidor ao salvar o ambiente."
        )

    return novo_ambiente

def obter_ambiente(session: Session, ambiente_id: int) -> Ambiente:
    """
    Busca um ambiente no banco de dados pelo seu ID.

    Args:
        session: A sessão do banco de dados.
        ambiente_id: O ID (int) do ambiente a ser buscado.

    Returns:
        A instância do modelo Ambiente correspondente ao ID.

    Raises:
        HTTPException: Se o ambiente com o ID fornecido não for encontrado (status 404).
    """
    # Usa session.get() para buscar um objeto pela chave primária.
    ambiente: Optional[Ambiente] = session.get(Ambiente, ambiente_id)

    if not ambiente:
        logger.warning(f"Ambiente com ID {ambiente_id} não encontrado.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambiente não encontrado."
        )

    return ambiente

def obter_ambientes(
    session: Session,
    skip: int = 0,
    limit: int = 100,
    tipo: Optional[TipoAmbiente] = None, # Opcional: Filtrar por tipo de ambiente
    ativo: Optional[bool] = None # Opcional: Filtrar por status ativo
) -> List[Ambiente]:
    """
    Retorna uma lista paginada de ambientes, opcionalmente filtrada por tipo e status ativo.

    Args:
        session: A sessão do banco de dados.
        skip: O número de registros a serem pulados.
        limit: O número máximo de registros a serem retornados.
        tipo: Opcional. Filtra ambientes por TipoAmbiente.
        ativo: Opcional. Filtra ambientes por status ativo (True/False).

    Returns:
        Uma lista de instâncias do modelo Ambiente.
    """
    # Cria uma query para selecionar ambientes
    query = select(Ambiente)

    # Aplica filtros se foram fornecidos
    if tipo is not None:
        query = query.where(Ambiente.tipo_ambiente == tipo)
    if ativo is not None:
         query = query.where(Ambiente.ativo == ativo)

    # Aplica offset (skip) e limit
    query = query.offset(skip).limit(limit)

    # Executa a query e obtém todos os resultados
    ambientes: List[Ambiente] = session.exec(query).all()

    return ambientes

def atualizar_ambiente(
    session: Session,
    ambiente_existente: Ambiente, # Instância do ambiente já obtida
    ambiente_update: AmbienteUpdate # Dados de atualização
) -> Ambiente:
    """
    Atualiza os dados de um ambiente existente.

    Args:
        session: A sessão do banco de dados.
        ambiente_existente: A instância do modelo Ambiente a ser atualizada.
        ambiente_update: Um objeto AmbienteUpdate com os campos a serem atualizados (opcionais).

    Returns:
        A instância do modelo Ambiente atualizada.

    Raises:
         HTTPException: Se ocorrer um erro inesperado ao salvar (status 500).
    """
    # Converte o schema de atualização para um dicionário, excluindo campos não definidos.
    update_data = ambiente_update.model_dump(exclude_unset=True)

    # Aplica os dados de atualização à instância existente usando sqlmodel_update.
    ambiente_existente.sqlmodel_update(update_data)

    # Adiciona a instância modificada à sessão.
    session.add(ambiente_existente)
    try:
        session.commit()
        session.refresh(ambiente_existente)
    except Exception as e:
        session.rollback()
        logger.error(f"Erro inesperado ao atualizar ambiente {ambiente_existente.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno no servidor ao atualizar o ambiente."
        )

    return ambiente_existente

def deletar_ambiente(session: Session, ambiente_id: int) -> Ambiente:
    """
    Deleta um ambiente do banco de dados pelo seu ID.

    Args:
        session: A sessão do banco de dados.
        ambiente_id: O ID (int) do ambiente a ser deletado.

    Returns:
        A instância do modelo Ambiente que foi deletada.

    Raises:
        HTTPException: Se o ambiente com o ID fornecido não for encontrado (status 404).
    """
    # Busca o ambiente para garantir que ele existe (obter_ambiente já lida com 404).
    ambiente = obter_ambiente(session, ambiente_id) # Lança 404 se não existir

    # Prepara para deletar.
    session.delete(ambiente)
    try:
        session.commit()
        # Retornamos o objeto antes do commit, mas ele pode não ser totalmente útil depois.
    except Exception as e:
        session.rollback()
        logger.error(f"Erro inesperado ao deletar ambiente {ambiente_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno no servidor ao deletar o ambiente."
        )

    # Retorna a instância do ambiente que foi deletada.
    return ambiente

def ambiente_tem_reservas(session: Session, ambiente_id: int) -> bool:
    """
    Verifica se um ambiente tem alguma reserva associada (ativa ou histórica).

    Args:
        session: Sessão do banco de dados.
        ambiente_id: O ID do ambiente a verificar.

    Returns:
        True se o ambiente tiver pelo menos uma reserva (na tabela Reserva ou HistoricoReserva), False caso contrário.
    """
    # Verificar na tabela Reserva (onde a restrição FK está)
    reserva_ativa = session.exec(
        select(Reserva.id).where(Reserva.ambiente_id == ambiente_id).limit(1) # Limit 1 para eficiência
    ).first()

    if reserva_ativa:
        return True

    # Se você quer verificar histórico também (embora a restrição FK seja só na tabela Reserva), descomente e ajuste:
    # historico_entry = session.exec(
    #     select(HistoricoReserva.id).where(HistoricoReserva.ambiente_id == ambiente_id).limit(1)
    # ).first()
    # if historico_entry:
    #     return True

    # Se não encontrou em Reserva (e não verificou histórico ou não encontrou lá)
    return False

# =============================================
# Funções Específicas (Autenticação, Promoção/Demote, etc.)
# =============================================

def autenticar_usuario(session: Session, email: str, senha: str) -> Optional[Usuario]:
    """
    Autentica um usuário buscando por email e verificando a senha fornecida.

    Args:
        session: A sessão do banco de dados.
        email: O email do usuário tentando autenticar.
        senha: A senha em texto puro fornecida pelo usuário.

    Returns:
        A instância do modelo Usuario se a autenticação for bem-sucedida (usuário encontrado e senha correta),
        ou None caso contrário.
    """
    # 1. Buscar o usuário por email.
    # Usa .first() pois email é UNIQUE.
    usuario: Optional[Usuario] = session.exec(
        select(Usuario).where(Usuario.email == email)
    ).first()

    # 2. Verificar se o usuário foi encontrado E se a senha fornecida corresponde ao hash armazenado.
    # Usa verify_password() do módulo de segurança.
    # Se o usuário não for encontrado (usuario is None) OU a senha não verificar, a condição falha.
    if not usuario or not verify_password(senha, usuario.senha_hash):
        # Se o usuário não foi encontrado OU a senha não corresponde, retorna None indicando falha na autenticação.
        return None

    # 3. Se chegou aqui, o usuário existe e a senha está correta. A autenticação foi bem-sucedida.
    return usuario # Retorna a instância do objeto Usuario autenticado.

def promover_usuario_admin(session: Session, usuario_id: uuid.UUID) -> Usuario:
    """
    Promove um usuário para o tipo 'admin'.

    Args:
        session: A sessão do banco de dados.
        usuario_id: O UUID do usuário a ser promovido.

    Returns:
        A instância do modelo Usuario atualizada (agora com tipo 'admin').

    Raises:
        HTTPException: Se o usuário não for encontrado (status 404) ou
                       se ocorrer um erro inesperado ao salvar (status 500).
        # Opcional: Poderia levantar 400 se o usuário já for admin, dependendo da lógica de negócio desejada.
    """
    # Busca o usuário a ser promovido. Reutiliza obter_usuario que já trata o 404.
    usuario_a_promover = obter_usuario(session, usuario_id) # Lança 404 se não existir

    # Opcional: Verifique se já é admin se quiser um tratamento específico.
    # if usuario_a_promover.tipo == TipoUsuario.admin:
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário já é administrador.")

    # Atualiza o campo tipo para admin
    usuario_a_promover.tipo = TipoUsuario.admin

    # Adiciona a instância modificada à sessão (marca para update)
    session.add(usuario_a_promover)
    try:
        session.commit() # Commita a transação (executa o UPDATE)
        session.refresh(usuario_a_promover) # Atualiza a instância
    except Exception as e: # Captura possíveis erros no commit
        session.rollback()
        logger.error(f"Erro inesperado ao promover usuário {usuario_id} para admin: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao atualizar usuário no banco.")

    return usuario_a_promover # Retorna o objeto Usuario promovido.

# Função para rebaixar admin para user
def rebaixar_admin_para_usuario(session: Session, usuario_id: uuid.UUID) -> Usuario:
    """
    Rebaixa um usuário com privilégios de administrador para o tipo 'user'.
    Requer privilégios de administrador para chamar esta função no router.

    Args:
        session: Sessão do banco de dados.
        usuario_id: O UUID do usuário a ser rebaixado.

    Returns:
        A instância do modelo Usuario atualizada (agora com tipo 'user').

    Raises:
        HTTPException: Se o usuário não for encontrado (404),
                       se o usuário não for um administrador (400 Bad Request), ou
                       se ocorrer um erro inesperado ao salvar (500).
    """
    # 1. Obter o usuário a ser rebaixado (obter_usuario já lida com 404).
    usuario_a_rebaixar = obter_usuario(session, usuario_id) # Lança 404 se não existir

    # 2. Verificar se o usuário é realmente um administrador antes de tentar rebaixar.
    if usuario_a_rebaixar.tipo != TipoUsuario.admin:
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST, # 400: Requisição Inválida
             detail="Usuário não é administrador e não pode ser rebaixado."
         )

    # Opcional: Impedir que um admin rebaixe a si mesmo? Geralmente é uma boa ideia.
    # if usuario_a_rebaixar.id == id_do_admin_logado_chamando_aqui:
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode rebaixar a si mesmo.")
    # Para implementar isso, você precisaria passar o usuário logado para esta função CRUD também.

    # 3. Atualizar o campo tipo para 'user'.
    usuario_a_rebaixar.tipo = TipoUsuario.user

    # 4. Adicionar a instância modificada à sessão e commitar.
    session.add(usuario_a_rebaixar)
    try:
        session.commit()
        session.refresh(usuario_a_rebaixar) # Atualiza a instância
    except Exception as e:
        session.rollback()
        logger.error(f"Erro inesperado ao rebaixar usuário {usuario_id} para user: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao atualizar usuário no banco.")

    # 5. Retorna a instância do usuário rebaixado.
    return usuario_a_rebaixar

def usuario_tem_reservas(session: Session, usuario_id: uuid.UUID) -> bool:
    """
    Verifica se um usuário tem alguma reserva associada (ativa ou histórica).

    Args:
        session: Sessão do banco de dados.
        usuario_id: O UUID do usuário a verificar.

    Returns:
        True se o usuário tiver pelo menos uma reserva (na tabela Reserva ou HistoricoReserva), False caso contrário.
    """
    # Verificar na tabela Reserva
    reserva_ativa = session.exec(
        select(Reserva.id).where(Reserva.usuario_id == usuario_id).limit(1) # Limit 1 para eficiência
    ).first()

    if reserva_ativa:
        return True

    # Verificar na tabela HistoricoReserva (se considerar histórico também)
    # Se a regra for apenas reservas *ativas*, pule a checagem de HistoricoReserva.
    # Geralmente, a restrição DELETE impede se há FKs PENDENTES. Se sua FK em Reserva.usuario_id
    # não for NULLABLE, ela impedirá se houver reservas *ativas*. Histórico não tem FK de volta.
    # Vamos verificar APENAS reservas na tabela principal (Reserva) para alinhar com a restrição FK que você quer.

    # Se você quer verificar histórico também, descomente e ajuste:
    # historico_entry = session.exec(
    #     select(HistoricoReserva.id).where(HistoricoReserva.usuario_id == usuario_id).limit(1)
    # ).first()
    # if historico_entry:
    #     return True

    # Se não encontrou em Reserva (e não verificou histórico ou não encontrou lá)
    return False

# =============================================
# Funções de Verificação de Disponibilidade
# =============================================

def verificar_disponibilidade_ambiente(
    session: Session,
    ambiente_id: int,
    data_inicio: datetime,
    data_fim: datetime,
    reserva_id_excluir: Optional[int] = None # Opcional: ID da reserva a ser excluída da verificação (útil para atualizações)
) -> bool:
    """
    Verifica se um ambiente está disponível para reserva em um período específico.

    Considera apenas reservas confirmadas ou pendentes.
    Args:
        session: Sessão do banco de dados.
        ambiente_id: ID do ambiente a verificar.
        data_inicio: Data e hora de início desejada.
        data_fim: Data e hora de fim desejada.
        reserva_id_excluir: ID de uma reserva (a ser atualizada) para excluir da checagem de sobreposição.

    Returns:
        True se o ambiente estiver disponível, False caso contrário.
    """
    # Garante que data_inicio é antes de data_fim
    if data_inicio >= data_fim:
        logger.warning(f"Verificação de disponibilidade com datas inválidas: inicio={data_inicio}, fim={data_fim}")
        # Trate isso no validador do schema ou na função de criação/atualização do router/CRUD
        # Para esta função, simplesmente retorna False ou lança um erro.
        # Vamos retornar False, pois não está disponível com datas inválidas.
        return False

    # Busca por reservas existentes no mesmo ambiente que sobreponham o período desejado.
    # Consideramos sobreposição se os períodos se cruzam.
    # Duas datas [A, B] e [C, D] se sobrepõem se (A < D e C < B).

    query = select(Reserva).where(
        Reserva.ambiente_id == ambiente_id,
        # Considera apenas status que bloqueiam a reserva
        Reserva.status.in_([StatusReserva.PENDENTE, StatusReserva.CONFIRMADA]),
        # Condição de sobreposição: a nova reserva começa antes do fim da existente E a existente começa antes do fim da nova.
        and_(
            Reserva.data_inicio < data_fim,
            Reserva.data_fim > data_inicio
        )
    )

    # Se estiver verificando disponibilidade para uma atualização de reserva,
    # exclua a reserva original da checagem para evitar conflito com ela mesma.
    if reserva_id_excluir is not None:
        query = query.where(Reserva.id != reserva_id_excluir)

    # Executa a query para ver se encontra ALGUMA reserva sobreposta.
    # Usamos .first() porque precisamos apenas saber se existe pelo menos uma.
    reserva_sobreposta: Optional[Reserva] = session.exec(query).first()

    # Se .first() retornou uma reserva, significa que há sobreposição -> ambiente NÃO está disponível.
    return reserva_sobreposta is None # Retorna True se NÃO encontrou sobreposição, False se encontrou.


# =============================================
# Funções CRUD para Reserva (Reserva)
# =============================================

def criar_reserva(reserva_create: ReservaCreate, session: Session, usuario_id_para_reserva: uuid.UUID) -> Reserva: # <--- MODIFICADO: Aceita o ID a ser associado
    """
    Cria uma nova reserva no banco de dados para um usuário específico após verificar disponibilidade.
    Define o status inicial como PENDENTE.

    Args:
        reserva_create: Dados da reserva (ambiente_id, data_inicio, data_fim, motivo).
        session: Sessão do banco de dados.
        usuario_id_para_reserva: ID do usuário que será o responsável pela reserva.

    Returns:
        A instância do modelo Reserva recém-criada (status PENDENTE).

    Raises:
        HTTPException: Se o ambiente não estiver disponível (409 Conflict),
                       se ocorrer um erro inesperado ao salvar (500), ou
                       se ambiente_id não existir (se adicionar checagem).
    """
    # Opcional: Verificar se o ambiente com ambiente_id existe (antes de verificar disponibilidade).

    # 1. Verifica a disponibilidade do ambiente (como antes).
    is_available = verificar_disponibilidade_ambiente(
        session,
        reserva_create.ambiente_id,
        reserva_create.data_inicio,
        reserva_create.data_fim
    )

    if not is_available:
        # ... (lógica de erro 409) ...
        raise HTTPException(...)

    # 2. Cria uma instância do modelo ORM Reserva.
    #    Usa o ID passado como parâmetro para associar a reserva.
    nova_reserva = Reserva(
        ambiente_id=reserva_create.ambiente_id,
        usuario_id=usuario_id_para_reserva, # <--- USA o ID passado como parâmetro
        data_inicio=reserva_create.data_inicio,
        data_fim=reserva_create.data_fim,
        motivo=reserva_create.motivo,
        status=StatusReserva.PENDENTE,
    )

    # 3. Adiciona a nova reserva à sessão e salva (como antes).
    session.add(nova_reserva)
    try:
        session.commit()
        session.refresh(nova_reserva)
    except Exception as e:
        # ... (lógica de erro 500) ...
        raise HTTPException(...)

    return nova_reserva

def obter_reserva(session: Session, reserva_id: int) -> Reserva:
    """
    Busca uma reserva no banco de dados pelo seu ID.
    Carrega os dados aninhados de usuário e ambiente.

    Args:
        session: Sessão do banco de dados.
        reserva_id: ID da reserva.

    Returns:
        A instância do modelo Reserva com relacionamentos carregados.

    Raises:
        HTTPException: Se a reserva não for encontrada (status 404).
    """
    # Usa select com options para carregar os relacionamentos 'usuario' e 'ambiente'.
    # selectinload é geralmente eficiente para relacionamentos Many-to-One ou One-to-Many com um número limitado de itens relacionados.
    query = select(Reserva).where(Reserva.id == reserva_id).options(
        selectinload(Reserva.usuario), # Carrega os dados do usuário relacionado
        selectinload(Reserva.ambiente) # Carrega os dados do ambiente relacionado
    )
    reserva: Optional[Reserva] = session.exec(query).first()

    if not reserva:
        logger.warning(f"Reserva com ID {reserva_id} não encontrada.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada."
        )

    return reserva

# Esta função é necessária para a rota GET /reservas/.
def obter_reservas(
    session: Session,
    skip: int = 0,
    limit: int = 100,
    usuario_id: Optional[uuid.UUID] = None, # Query parameter do router
    ambiente_id: Optional[int] = None,     # Query parameter do router
    status: Optional[StatusReserva] = None,# Query parameter do router
    data_inicio_ge: Optional[datetime] = None, # Query parameter do router
    data_inicio_le: Optional[datetime] = None, # Query parameter do router
    data_fim_ge: Optional[datetime] = None,    # Query parameter do router
    data_fim_le: Optional[datetime] = None     # Query parameter do router
) -> List[Reserva]:
    """
    Retorna uma lista paginada de reservas, opcionalmente filtrada por vários critérios.
    Carrega os dados aninhados de usuário e ambiente para o schema ReservaRead.

    Args:
        session: Sessão do banco de dados.
        skip: Número de registros a pular.
        limit: Número máximo de registros a retornar.
        usuario_id: Opcional. Filtra por ID de usuário.
        ambiente_id: Opcional. Filtra por ID de ambiente.
        status: Opcional. Filtra por status da reserva.
        data_inicio_ge: Opcional. Filtra por data_inicio >= este valor.
        data_inicio_le: Opcional. Filtra por data_inicio <= este valor.
        data_fim_ge: Opcional. Filtra por data_fim >= este valor.
        data_fim_le: Opcional. Filtra por data_fim <= este valor.

    Returns:
        Uma lista de instâncias do modelo Reserva com relacionamentos carregados.
    """
    # Cria a query base para selecionar Reservas e carregar os relacionamentos para o schema ReservaRead.
    query = select(Reserva).options(
        selectinload(Reserva.usuario),
        selectinload(Reserva.ambiente)
    )

    # Aplica filtros baseados nos parâmetros fornecidos.
    # Usa .where() para adicionar condições à query.
    if usuario_id is not None:
        query = query.where(Reserva.usuario_id == usuario_id)
    if ambiente_id is not None:
        query = query.where(Reserva.ambiente_id == ambiente_id)
    if status is not None:
        query = query.where(Reserva.status == status)

    # Filtros de data/hora podem ser combinados.
    if data_inicio_ge is not None:
        query = query.where(Reserva.data_inicio >= data_inicio_ge)
    if data_inicio_le is not None:
        query = query.where(Reserva.data_inicio <= data_inicio_le)

    if data_fim_ge is not None:
        query = query.where(Reserva.data_fim >= data_fim_ge)
    if data_fim_le is not None:
        query = query.where(Reserva.data_fim <= data_fim_le)

    # Aplica paginação (offset e limit).
    query = query.offset(skip).limit(limit)

    # Executa a query e obtém a lista de resultados.
    reservas: List[Reserva] = session.exec(query).all()

    return reservas # Retorna a lista de objetos Reserva.

# Implementar atualizar_reserva (sem status).
def atualizar_reserva(
    session: Session,
    reserva_existente: Reserva, # Instância da reserva já obtida (do DB, por exemplo, pela rota)
    reserva_update: ReservaUpdate, # Dados de atualização (schema de entrada)
    current_user: Usuario # Para verificar permissões
) -> Reserva:
    """
    Atualiza os dados (datas, motivo, ambiente) de uma reserva existente.
    Requer permissão adequada (geralmente o próprio usuário se PENDENTE, ou admin).
    Verifica a disponibilidade se datas ou ambiente mudarem.

    Args:
        session: Sessão do banco de dados.
        reserva_existente: A instância do modelo Reserva a ser atualizada (já obtida do DB).
        reserva_update: Um objeto ReservaUpdate com os campos a serem atualizados (opcionais, SEM o campo 'status').
        current_user: A instância do usuário logado para checar permissões.

    Returns:
        A instância do modelo Reserva atualizada.

    Raises:
         HTTPException: Se a reserva não for encontrada (404 - tratada no router/chamador),
                       se a permissão para atualizar for negada (403 Forbidden),
                       se o ambiente não estiver disponível para o novo período (409 Conflict), ou
                       se ocorrer um erro inesperado ao salvar (500).
         # Nota: Validação de email único em update é mais complexa e não está incluída aqui por padrão.
    """
    # Lógica de Autorização: Apenas o proprietário da reserva (se PENDENTE) OU um administrador pode atualizar.
    is_owner = reserva_existente.usuario_id == current_user.id
    is_admin = current_user.tipo == TipoUsuario.admin

    # Regra de negócio: Só pode atualizar se for o dono E o status for PENDENTE, OU se for admin.
    # Reservas CONFIRMADAS, CANCELADAS, FINALIZADAS geralmente NÃO podem ser atualizadas em seus detalhes (apenas status por admin).
    # Ajuste a lógica de status aqui se necessário.
    if not ((is_owner and reserva_existente.status == StatusReserva.PENDENTE) or is_admin):
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Você só pode atualizar suas reservas pendentes ou precisa ser admin."
         )

    # Converte o schema de atualização para um dicionário, excluindo campos que não foram definidos.
    # NOTA: O campo 'status' NÃO DEVE vir neste schema ReservaUpdate.
    update_data = reserva_update.model_dump(exclude_unset=True)

    # **CORREÇÃO DE SEGURANÇA:** Remove o campo 'status' do dicionário de atualização
    # caso ele tenha sido acidentalmente incluído no schema ou na requisição.
    update_data.pop("status", None) # Remove a chave 'status' se existir. 'None' evita erro se não existir.

    # Verificar se datas ou ambiente_id foram modificados para re-verificar disponibilidade.
    # Precisamos verificar se a *chave* está em update_data E o *valor* é diferente do valor existente.
    dates_or_ambiente_changed = False
    if "data_inicio" in update_data and update_data["data_inicio"] != reserva_existente.data_inicio:
        dates_or_ambiente_changed = True
    if "data_fim" in update_data and update_data["data_fim"] != reserva_existente.data_fim:
        dates_or_ambiente_changed = True
    if "ambiente_id" in update_data and update_data["ambiente_id"] != reserva_existente.ambiente_id:
         dates_or_ambiente_changed = True

    # Se datas ou ambiente_id mudaram, verificar disponibilidade.
    # Excluímos a reserva original da checagem de sobreposição.
    if dates_or_ambiente_changed:
         # Use os novos valores do update_data se presentes, senão use os valores existentes da reserva.
         # Isso garante que usamos os valores *corretos* para a checagem.
         new_data_inicio = update_data.get("data_inicio", reserva_existente.data_inicio)
         new_data_fim = update_data.get("data_fim", reserva_existente.data_fim)
         new_ambiente_id = update_data.get("ambiente_id", reserva_existente.ambiente_id)

         is_available = verificar_disponibilidade_ambiente(
             session,
             new_ambiente_id,
             new_data_inicio,
             new_data_fim,
             reserva_id_excluir=reserva_existente.id # Exclui a própria reserva da checagem
         )

         if not is_available:
             raise HTTPException(
                 status_code=status.HTTP_409_CONFLICT,
                 detail="O ambiente não está disponível para o novo período solicitado."
             )

    # Aplica os dados de atualização à instância existente usando sqlmodel_update.
    reserva_existente.sqlmodel_update(update_data)

    session.add(reserva_existente)
    try:
        session.commit()
        session.refresh(reserva_existente)
    except Exception as e:
        session.rollback()
        logger.error(f"Erro inesperado ao atualizar reserva {reserva_existente.id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao atualizar a reserva.")

    return reserva_existente


def atualizar_status_reserva( 
    session: Session,
    reserva_id: int, # ID da reserva a ter o status atualizado
    novo_status: StatusReserva, # O novo status desejado
    # **ADICIONADO:** Passar o usuário logado para verificar permissões
    current_user: Usuario # <--- ADICIONADO: A instância do usuário logado (obtido do router)
) -> Reserva: # Retorna a reserva com o status atualizado
    """
    Atualiza o status de uma reserva específica.
    Requer privilégios adequados: Admin sempre pode mudar o status.
    Usuário comum pode mudar status para CANCELADA SE for o dono E status atual for PENDENTE.
    Verifica transições de status válidas (regra de negócio).
    Move a reserva para o histórico e a deleta da tabela principal se o novo status for FINALIZADA ou CANCELADA.

    Args:
        session: Sessão do banco de dados.
        reserva_id: ID da reserva a ser atualizada.
        novo_status: O novo StatusReserva desejado.
        current_user: A instância do usuário logado (obtida do router, seja ele user ou admin).

    Returns:
        A instância do modelo Reserva com o status atualizado.

    Raises:
        HTTPException: Se a reserva não for encontrada (status 404),
                       se a permissão for negada (403 Forbidden),
                       se a transição de status for inválida (400 Bad Request), ou
                       se ocorrer um erro inesperado ao salvar (status 500).
    """
    # 1. Obter a reserva por ID (lidando com 404).
    reserva_a_atualizar = obter_reserva(session, reserva_id) # Lança 404 se não existir

    # 2. Lógica de Autorização: Quem pode mudar o status para o novo_status desejado?
    is_admin = current_user.tipo == TipoUsuario.admin
    is_owner = reserva_a_atualizar.usuario_id == current_user.id # Verificar se é o dono da reserva

    # Regra de Permissão para Mudar STATUS:
    # - Admin SEMPRE pode mudar para QUALQUER status (respeitando regras de transição).
    # - Usuário comum (não admin) SÓ pode mudar para CANCELADA, E SOMENTE SE for o DONO E o status atual for PENDENTE.
    can_update_status = False

    if is_admin:
        can_update_status = True # Admin pode fazer qualquer mudança de status (respeitando regras de transição)
    elif is_owner and reserva_a_atualizar.status == StatusReserva.PENDENTE and novo_status == StatusReserva.CANCELADA:
        # Usuário comum (dono) pode CANCELAR sua própria reserva SE ela estiver PENDENTE.
        can_update_status = True
    # Nenhuma outra mudança de status é permitida para usuários comuns (ex: CONFIRMAR, FINALIZAR).

    if not can_update_status:
        # Se a ação de mudar para este status específico não é permitida para este usuário.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Você não tem permissão para alterar o status desta reserva para este valor."
        )


    # 3. Verificar se a transição de status é válida (regra de negócio global, mesmo para admin).
    # Regra: Não permitir ir de CANCELADA para CONFIRMADA.
    if reserva_a_atualizar.status == StatusReserva.CANCELADA and novo_status == StatusReserva.CONFIRMADA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível confirmar uma reserva cancelada."
        )
    # Adicione outras regras de transição se necessário (ex: só pode ir de PENDENTE para CONFIRMADA ou CANCELADA).
    # if reserva_a_atualizar.status == StatusReserva.PENDENTE and novo_status not in [StatusReserva.CONFIRMADA, StatusReserva.CANCELADA]:
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Não é possível ir do status PENDENTE para {novo_status}.")
    # etc.


    # 4. Atualizar o campo status da reserva.
    reserva_a_atualizar.status = novo_status

    # 5. Adicionar a instância modificada à sessão e commitar.
    session.add(reserva_a_atualizar)
    try:
        session.commit()
        session.refresh(reserva_a_atualizar)

        # 6. Se o novo status for FINALIZADA ou CANCELADA, mover para o histórico E DELETAR.
        if novo_status in [StatusReserva.FINALIZADA, StatusReserva.CANCELADA]:
            logger.info(f"Reserva {reserva_a_atualizar.id} atualizada para status {novo_status}. Movendo para histórico e deletando...")
            # Chama a função para mover para o histórico.
            mover_reserva_para_historico(session, reserva_a_atualizar) # Esta função agora deleta a original
            logger.info(f"Reserva {reserva_a_atualizar.id} movida para histórico e deletada da tabela principal.")


    except Exception as e:
        session.rollback()
        logger.error(f"Erro inesperado ao atualizar status da reserva {reserva_id}: {e}", exc_info=True)
        # Use valor numérico 500 se a importação de status ainda for problemática
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao atualizar status da reserva.")

    # 7. Retorna a instância da reserva atualizada.
    return reserva_a_atualizar

# def deletar_reserva(
#     session: Session,
#     reserva_id: int,
#     current_user: Usuario # Para verificar permissão
# ) -> Reserva:
#     """
#     Deleta uma reserva do banco de dados pelo seu ID.
#     Requer permissão adequada (geralmente o próprio usuário se PENDENTE, ou admin).

#     Args:
#         session: Sessão do banco de dados.
#         reserva_id: O ID (int) da reserva a ser deletada.
#         current_user: A instância do usuário logado para checar permissões.

#     Returns:
#         A instância do modelo Reserva que foi deletada.

#     Raises:
#         HTTPException: Se a reserva não for encontrada (404),
#                        se a permissão para deletar for negada (403 Forbidden), ou
#                        se ocorrer um erro inesperado ao salvar (500).
#     """
#     # 1. Obter a reserva para garantir que ela existe (obter_reserva já lida com 404).
#     reserva_a_deletar = obter_reserva(session, reserva_id) # Lança 404 se não existir

#     # 2. Lógica de Autorização: Apenas o proprietário da reserva (se PENDENTE) OU um administrador pode deletar.
#     # Regra: Não pode deletar se já foi CONFIRMADA, CANCELADA ou FINALIZADA, A MENOS QUE seja admin.
#     is_owner = reserva_a_deletar.usuario_id == current_user.id
#     is_admin = current_user.tipo == TipoUsuario.admin

#     if not ((is_owner and reserva_a_deletar.status == StatusReserva.PENDENTE) or is_admin):
#         # Se não for admin E (não for o dono OU não estiver PENDENTE)
#          raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Acesso negado. Você só pode deletar suas reservas pendentes ou precisa ser admin."
#          )


#     # 3. Prepara para deletar.
#     session.delete(reserva_a_deletar)
#     try:
#         session.commit()
#         # Retornamos o objeto antes do commit, mas ele pode não ser totalmente útil depois.
#     except Exception as e:
#         session.rollback()
#         logger.error(f"Erro inesperado ao deletar reserva {reserva_id}: {e}", exc_info=True)
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Ocorreu um erro interno no servidor ao deletar a reserva."
#         )

#     # 4. Retorna a instância da reserva que foi deletada.
#     return reserva_a_deletar

# Implementar mover_reserva_para_historico.
def mover_reserva_para_historico(session: Session, reserva_original: Reserva) -> HistoricoReserva:
    """
    Copia os dados de uma reserva para a tabela HistoricoReserva e DELETA a reserva original.
    Geralmente chamada após o status ser atualizado para FINALIZADA ou CANCELADA.

    Args:
        session: Sessão do banco de dados.
        reserva_original: A instância da Reserva a ser copiada e deletada.

    Returns:
        A instância do modelo HistoricoReserva recém-criada.

    Raises:
        HTTPException: Se ocorrer um erro inesperado ao salvar no histórico ou deletar (status 500).
        # Lida com IntegrityError se já existir um histórico para este ID.
    """
    # Lógica de cópia de dados. Cria uma nova instância de HistoricoReserva.
    # Regra: usar o ID da reserva original como PK do histórico.
    historico_entry = HistoricoReserva(
        id=reserva_original.id, # Usa o ID da reserva original como PK do histórico
        ambiente_id=reserva_original.ambiente_id,
        nome_amb=reserva_original.ambiente.nome,
        usuario_id=reserva_original.usuario_id,
        nome_usu=reserva_original.usuario.nome,
        data_inicio=reserva_original.data_inicio,
        data_fim=reserva_original.data_fim,
        data_criacao=reserva_original.data_criacao,
        status=reserva_original.status, # O status final (CANCELADA ou FINALIZADA)
        motivo=reserva_original.motivo
    )

    # Adiciona a nova entrada de histórico à sessão.
    session.add(historico_entry)

    try:
        # Tenta commitar a adição do histórico.
        # Se der IntegrityError aqui (ID já existe no histórico), a deleção original não acontecerá.
        session.commit()
        session.refresh(historico_entry) # Obtém a instância completa do histórico.

        # DELETA a reserva original da tabela principal APÓS a cópia para o histórico ser bem-sucedida.
        # session.delete(reserva_original)
        # session.commit() # Commita a deleção.

        # Alternativa: Incluir a deleção no MESMO commit para garantir atomicidade:
        session.delete(reserva_original)
        session.commit() # Commita tanto a adição do histórico quanto a deleção da original.
        logger.info(f"Reserva original {reserva_original.id} deletada após mover para histórico.")


    except IntegrityError as e:
        # Se o histórico para este ID já existe (IntegrityError), a deleção original não ocorrerá.
        session.rollback()
        logger.error(f"Erro de integridade: Histórico para reserva {reserva_original.id} já existe. Deleção original ABORTADA.", exc_info=True)
        # Dependendo da regra, você pode querer lançar um erro aqui ou apenas logar.
        # Vamos logar e lançar um 500 para indicar que algo deu errado no processo.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao mover para histórico: Registro de histórico já existe.")
    except Exception as e:
        session.rollback()
        logger.error(f"Erro inesperado ao mover reserva {reserva_original.id} para histórico e deletar: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao processar o histórico da reserva.")


    return historico_entry

def obter_historico_reservas( # Nome corrigido para 'obter'
    session: Session,
    skip: int = 0,
    limit: int = 100,
    # Query parameters para filtros (usuario_id, ambiente_id, status, período)
    usuario_id: Optional[uuid.UUID] = None,
    ambiente_id: Optional[int] = None,
    status: Optional[StatusReserva] = None,
    data_inicio_ge: Optional[datetime] = None,
    data_inicio_le: Optional[datetime] = None,
    data_fim_ge: Optional[datetime] = None,
    data_fim_le: Optional[datetime] = None,
    # **ADICIONADO:** Parâmetros opcionais para filtrar por nome de ambiente e usuário
    nome_amb: Optional[str] = None, # <--- ADICIONADO
    nome_usu: Optional[str] = None  # <--- ADICIONADO
) -> List[HistoricoReserva]: # Retorna lista de HistoricoReserva
    """
    Retorna uma lista paginada de registros de histórico de reservas, opcionalmente filtrada.

    Args:
        session: Sessão do banco de dados.
        skip: Número de registros a pular.
        limit: Número máximo de registros a retornar.
        usuario_id: Opcional. Filtra por ID de usuário no histórico.
        ambiente_id: Opcional. Filtra por ID de ambiente no histórico.
        status: Opcional. Filtra por status no histórico.
        data_inicio_ge: Opcional. Filtra histórico por data_inicio >= este valor.
        data_inicio_le: Opcional. Filtra histórico por data_inicio <= este valor.
        data_fim_ge: Opcional. Filtra histórico por data_fim >= este valor.
        data_fim_le: Opcional. Filtra histórico por data_fim <= este valor.
        nome_amb: Opcional. Filtra histórico por nome de ambiente (busca parcial, case-insensitive).
        nome_usu: Opcional. Filtra histórico por nome de usuário (busca parcial, case-insensitive).


    Returns:
        Uma lista de instâncias do modelo HistoricoReserva.
    """
    # Cria a query base para selecionar HistoricoReserva.
    query = select(HistoricoReserva)

    # Aplica filtros baseados nos parâmetros fornecidos.
    if usuario_id is not None:
        query = query.where(HistoricoReserva.usuario_id == usuario_id)
    if ambiente_id is not None:
        query = query.where(HistoricoReserva.ambiente_id == ambiente_id)
    if status is not None:
        query = query.where(HistoricoReserva.status == status)

    # Filtros de data/hora.
    if data_inicio_ge is not None:
        query = query.where(HistoricoReserva.data_inicio >= data_inicio_ge)
    if data_inicio_le is not None:
        query = query.where(HistoricoReserva.data_inicio <= data_inicio_le)

    if data_fim_ge is not None:
        query = query.where(HistoricoReserva.data_fim >= data_fim_ge)
    if data_fim_le is not None:
        query = query.where(HistoricoReserva.data_fim <= data_fim_le)

    # **ADICIONADO:** Filtros por nome de ambiente e usuário (busca parcial, case-insensitive)
    # Usamos .ilike() para busca case-insensitive e '%valor%' para busca parcial.
    if nome_amb is not None:
        query = query.where(HistoricoReserva.nome_amb.ilike(f"%{nome_amb}%")) # Busca parcial case-insensitive
    if nome_usu is not None:
        query = query.where(HistoricoReserva.nome_usu.ilike(f"%{nome_usu}%")) # Busca parcial case-insensitive


    # Aplica paginação.
    query = query.offset(skip).limit(limit)

    # Executa a query e obtém a lista.
    historico_reservas: List[HistoricoReserva] = session.exec(query).all()

    return historico_reservas


# =============================================
# Funções Específicas para Usuário (Autenticação, Promoção/Demote, etc.)
# =============================================
# ... (Funções de usuário específicas existentes) ...