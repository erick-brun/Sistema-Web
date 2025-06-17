# Define os modelos de entrada/saída de dados (validação e tipagem).
# Usado pelo FastAPI para validar os dados recebidos ou enviados nos endpoints da API.
# Também usado para tipagem clara em outras partes da aplicação (ex: CRUD).

# =============================================
# Importações
# =============================================
from sqlmodel import SQLModel, Field # Importa o base para definir schemas
from pydantic import EmailStr, validator # Importa tipos específicos e o decorador validator
from typing import Optional, List # Importa Optional para campos opcionais e List para listas paginadas/coleções
from .models import TipoUsuario, TipoAmbiente, StatusReserva # Importa Enum

from datetime import datetime, timezone, timedelta # Importa datetime para campos de data/hora
import re # Importa regex para validações de string
import uuid # Importa uuid para lidar com IDs do tipo UUID

# =============================================
# Schemas Base
# =============================================
# Schema base para campos comuns entre diferentes representações de usuário.
class UsuarioBase(SQLModel):
    """Schema base contendo campos comuns para criação e leitura de usuário."""
    nome: str
    email: EmailStr # EmailStr do Pydantic já faz validação de formato básica.

    @validator('nome')
    def valida_nome(cls, value: str) -> str:
        """Valida se o nome contém apenas letras (incluindo acentos), espaços e hifens."""
        # Regex aprimorada para permitir hifens, úteis em alguns nomes compostos.
        if not re.match(r'^[A-Za-zÀ-ÿ\s-]+$', value):
            raise ValueError('O nome deve conter apenas letras, espaços e hifens.')
        # Remove espaços extras no início/fim
        return value.strip()

# =============================================
# Schemas de Usuário (Criação, Login, Leitura, Atualização)
# =============================================

# Esquema para ENTRADA de dados ao cadastrar um novo usuário.
# Herda de UsuarioBase e adiciona o campo senha (em texto puro).
class UsuarioCreate(UsuarioBase):
    """Schema para criação de um novo usuário (dados de entrada)."""
    senha: str # Senha em texto puro (será hasheada no backend).

    @validator('senha')
    def senha_minima(cls, value: str) -> str:
        """Valida se a senha tem um comprimento mínimo."""
        if len(value) < 6: # Comprimento mínimo de 6 caracteres
            raise ValueError('A senha deve ter no mínimo 6 caracteres.')
        return value

    # Validador para complexidade da senha.
    # Descomente e ajuste conforme a política de segurança.
    # @validator('senha')
    # def valida_senha_complexa(cls, value: str) -> str:
    #     """Valida a complexidade da senha (maiuscula, minuscula, numero)."""
    #     if len(value) < 8: # Exemplo: pode aumentar o comprimento mínimo aqui também
    #         raise ValueError('Senha deve ter no mínimo 8 caracteres para validação de complexidade.')
    #     if not re.search(r'[A-Z]', value):
    #         raise ValueError('Senha deve conter pelo menos uma letra maiúscula.')
    #     if not re.search(r'[a-z]', value):
    #         raise ValueError('Senha deve conter pelo menos uma letra minúscula.')
    #     if not re.search(r'[0-9]', value):
    #         raise ValueError('Senha deve conter pelo menos um número.')
    #     # Opcional: se quiser exigir caracteres especiais
    #     # if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
    #     #     raise ValueError('Senha deve conter pelo menos um caractere especial.')
    #     return value


# Esquema para ENTRADA de dados no login.
# Não herda de UsuarioBase pois não precisa de todos os campos para o login (apenas email e senha).
class UsuarioLogin(SQLModel):
    """Schema para autenticação de usuário (dados de entrada no login)."""
    email: EmailStr # Email para login
    senha: str # Senha em texto puro para login


# Esquema para SAÍDA de dados (exibido ao retornar dados de um usuário).
# Inclui campos que vêm do banco de dados (ID, tipo, status, data de criação).
class UsuarioRead(UsuarioBase):
    """Schema para representar dados de um usuário ao serem retornados pela API."""
    id: uuid.UUID # ID gerado pelo banco (UUID)
    tipo: TipoUsuario # Tipo de usuário (user ou admin)
    ativo: bool # Status de ativação do usuário
    data_criacao: datetime # Data e hora da criação do usuário

    # Configuração necessária para que o Pydantic possa ler dados de uma instância do modelo ORM (SQLModel).
    class Config:
        from_attributes = True      


# Esquema para atualização de usuário (campos opcionais para atualização parcial via PATCH).
# Permite enviar apenas os campos que se deseja alterar.
class UsuarioUpdate(UsuarioBase):
    """Schema para atualização de dados de um usuário (dados de entrada)."""
    # Todos os campos são opcionais e iniciam como None.
    # model_dump(exclude_unset=True) no CRUD garantirá que apenas os campos enviados sejam atualizados.
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None # Incluído para permitir a atualização da senha.
    ativo: Optional[bool] = None # Incluído para permitir a atualização do status ativo.


# =============================================
# Schemas de Autenticação (Tokens)
# =============================================

# Esquema para a resposta de login bem-sucedido (incluindo o token JWT).
# Usado como response_model nos endpoints /login e /refresh.
class Token(SQLModel):
    """Schema para representar os tokens de autenticação retornados pela API."""
    access_token: str # O token JWT principal
    token_type: str = "bearer" # Tipo do token, geralmente "bearer"
    # Opcional: refresh_token: Optional[str] = None # Adicione se sua lógica de refresh token retornar o próprio refresh token


# Esquema para o payload do token (dados contidos DENTRO do token JWT).
# Útil para tipagem e documentação interna, mas geralmente não usado diretamente em endpoints.
class TokenData(SQLModel): 
    """Schema para o payload decodificado de um token JWT."""
    # 'sub' (subject) é uma claim padrão JWT, geralmente usada para o ID do usuário.
    # É opcional aqui pois o token pode estar expirado ou inválido antes de decodificar.
    sub: Optional[str] = None
    # Opcional: outras claims como 'scopes', 'tipo_usuario', etc.
    # tipo_usuario: Optional[TipoUsuario] = None


# =============================================
# Schemas de Listagem/Paginação (para endpoints que retornam coleções)
# =============================================

# Esquema para representar uma lista de usuários com informações de paginação (opcional).
# Usado como response_model em endpoints como GET /usuarios.
class UsuarioList(SQLModel): 
    """Schema para representar uma lista de usuários com metadados (ex: para paginação)."""
    usuarios: List[UsuarioRead] # Lista de objetos UsuarioRead.
    # count: int # Opcional: Total de usuários na base (útil para paginação no frontend).
    # skip: int # Opcional: O valor de skip usado na query.
    # limit: int # Opcional: O valor de limit usado na query.


# =============================================
# Schemas de Ambiente
# =============================================

# Schema base para campos comuns entre diferentes representações de ambiente.
class AmbienteBase(SQLModel):
    """Schema base contendo campos comuns para criação e atualização de ambiente."""
    nome: str
    capacidade: int
    descricao: str
    tipo_ambiente: TipoAmbiente # Usa o Enum TipoAmbiente
    # campos de comodidades
    tv: bool
    projetor: bool
    ar_condicionado: bool

    # Opcional: Validadores para capacidade (ex: > 0) ou nome/descricao (não vazios)


# Esquema para ENTRADA de dados ao criar um novo ambiente.
# Herda de AmbienteBase. Todos os campos em AmbienteBase já são obrigatórios para criar por padrão.
class AmbienteCreate(AmbienteBase):
    """Schema para criação de um novo ambiente (dados de entrada)."""
    pass # Não precisa adicionar campos extras, AmbienteBase já tem tudo.


# Esquema para SAÍDA de dados (exibido ao retornar dados de um ambiente).
# Inclui campos que vêm do banco de dados (ID, ativo) E os campos de AmbienteBase.
class AmbienteRead(AmbienteBase): # Herda de AmbienteBase
    """Schema para representar dados de um ambiente ao serem retornados pela API."""
    id: int # ID autoincremental do banco
    ativo: bool # Status de ativação do ambiente

    # Configuração necessária para ler de uma instância do modelo ORM (Ambiente).
    class Config:
        from_attributes = True


# Esquema para atualização de ambiente (campos opcionais para atualização parcial via PATCH).
# Herda de AmbienteBase, tornando todos os campos opcionais.
class AmbienteUpdate(AmbienteBase): # Herda de AmbienteBase
    """Schema para atualização de dados de um ambiente (dados de entrada)."""
    # Todos os campos de AmbienteBase são tornados opcionais e iniciam como None aqui.
    nome: Optional[str] = None
    capacidade: Optional[int] = None
    descricao: Optional[str] = None
    tipo_ambiente: Optional[TipoAmbiente] = None

    # **CORREÇÃO:** Adicionado campos de comodidades como opcionais para atualização
    tv: Optional[bool] = None
    projetor: Optional[bool] = None
    ar_condicionado: Optional[bool] = None

    ativo: Optional[bool] = None # Permitir atualizar o status ativo (este não está em AmbienteBase, adicionado aqui)


# Esquema para representar uma lista de ambientes com informações de paginação (opcional).
class AmbienteList(SQLModel):
    """Schema para representar uma lista de ambientes com metadados (ex: para paginação)."""
    ambientes: List[AmbienteRead] # Lista de objetos AmbienteRead.
    # Opcional: count: int # Total de ambientes na base
    # Opcional: skip: int
    # Opcional: limit: int


# =============================================
# Schemas de Reserva
# =============================================

# Schema base para campos comuns para criação e atualização de reserva.
class ReservaBase(SQLModel):
    """Schema base para criação e atualização de reserva."""
    data_inicio: datetime
    data_fim: datetime
    motivo: str = Field(max_length=100)

    # # Validadores para garantir que data_inicio < data_fim, datas futuras, etc.
    # @validator('data_inicio', 'data_fim')
    # def datas_futuras(cls, v: datetime) -> datetime: # Type hint
    #     """Valida se as datas são futuras (comparando com UTC).
    #     Converte datas ingênuas de entrada para UTC antes da comparação."""
    #     if v.tzinfo is None:
    #         v = v.replace(tzinfo=timezone.utc)



    #     # Agora, compara o valor de entrada (agora ciente de UTC) com a data/hora UTC atual.
    #     if v < datetime.now(timezone.utc):
    #         raise ValueError('Datas devem ser futuras')

    #     return v # Retorna o valor (agora ciente de fuso horário)
    
    @validator('data_fim')
    def data_fim_depois_data_inicio(cls, v, values):
        if 'data_inicio' in values and v <= values['data_inicio']:
            raise ValueError('Data fim deve ser posterior à data início')
        return v


# Esquema para ENTRADA de dados ao criar uma nova reserva.
# Recebe ambiente_id e os campos base. usuario_id virá do usuário logado no backend.
class ReservaCreate(ReservaBase): # Herda de ReservaBase
    """Schema para criação de uma nova reserva (dados de entrada do cliente)."""
    ambiente_id: int # ID do ambiente a ser reservado (vindo do frontend)
    # Opcional: Validador para garantir que ambiente_id existe (pode ser feito no CRUD também)


# Esquema para SAÍDA de dados (exibido ao retornar dados de uma reserva).
# Inclui ID, status, data_criacao, e aninha os dados completos do usuário e ambiente relacionados.
class ReservaRead(ReservaBase): # Herda de ReservaBase
    """Schema para representar dados de uma reserva ao serem retornados pela API."""
    id: int # ID da reserva
    data_criacao: datetime # Data da solicitação
    status: StatusReserva # Status da reserva

    ambiente: AmbienteRead # Aninha o schema de leitura de Ambiente
    usuario: UsuarioRead # Aninha o schema de leitura de Usuário

    # Configuração necessária para ler de uma instância do modelo ORM (Reserva),
    # incluindo relacionamentos carregados.
    class Config:
        from_attributes = True


# Esquema para atualização de reserva (campos opcionais via PATCH).
# Quais campos podem ser atualizados pelo usuário vs. admin?
# Ex: Usuário pode mudar datas/motivo (se pendente). Admin/Sistema pode mudar status.
class ReservaUpdate(ReservaBase): # Herda de ReservaBase (datas, motivo)
    """Schema para atualização de dados de uma reserva (dados de entrada)."""
    # Campos que podem ser atualizados (por usuário ou admin):
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    motivo: Optional[str] = None

    # ambiente_id pode ser mudado antes da confirmação? Sim, pelo usuário.
    ambiente_id: Optional[int] = None # Permitir mudança do ambiente (antes de confirmada)


# Esquema para representar uma lista de reservas.
class ReservaList(SQLModel):
    """Schema para representar uma lista de reservas com metadados (ex: para paginação)."""
    reservas: List[ReservaRead] # Lista de objetos ReservaRead.
    # Opcional: count: int


# =============================================
# Schemas de Histórico de Reserva
# =============================================

# Esquema para SAÍDA de dados de um registro de histórico.
# Baseado nos campos do modelo HistoricoReserva.
class HistoricoReservaRead(SQLModel):
    """Schema para representar um registro de histórico de reserva."""
    # Assume que o ID do histórico é o mesmo da reserva original ou um novo PK.
    # Se for novo PK, adicionar Optional[int] = Field(default=None, primary_key=True) (como no modelo)
    id: int # ID do histórico (se for PK, adicionar Optional e default=None)
    ambiente_id: int # ID do ambiente no histórico
    nome_amb: str
    usuario_id: uuid.UUID # ID do usuário no histórico
    nome_usu: str
    data_inicio: datetime
    data_fim: datetime
    data_criacao: datetime
    status: StatusReserva
    motivo: str

    class Config:
        from_attributes = True


# =============================================
# TODO: Adicionar Schemas para outras operações se necessário (ex: Aprovar/Recusar Reserva)
# =============================================
# class ReservaStatusUpdate(SQLModel):
#     status: StatusReserva # Ex: Schema dedicado apenas para mudar o status