# # Define as classes que representam as tabelas do banco de dados.
# # Usa SQLModel para definir os campos e relações.
 
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid

# Enum: Tipos de Usuário
class TipoUsuario(str, Enum):
    """Enum para definir os tipos de usuários permitidos."""
    user = "user"
    admin = "admin"

# Modelo de Usuário (Tabela do Banco)
class Usuario(SQLModel, table=True):
    """Representa um usuário do sistema com informações de login e tipo."""
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,  # Gera UUID automaticamente
        primary_key=True,
        index=True
    )

    nome: str  # Nome completo

    email: str = Field(
        unique=True,  # Garante que não existam e-mails duplicados
        index=True     # Otimiza buscas por e-mail
    )

    senha_hash: str  # Senha criptografada (hash)

    tipo: TipoUsuario = Field(
        default=TipoUsuario.user  # Todo novo usuário é "user" por padrão
    )

    ativo: bool = Field(default=True) # usuario por padrão já está ativo, até que algum admin desative
    data_criacao: datetime = Field(default_factory=datetime.now)  # Data da criação do usuário
    # Relacionamento inverso (um Usuario pode ter muitas Reservas)
    reservas: List["Reserva"] = Relationship(back_populates="usuario")


    # - O uso de UUID como ID evita exposição da quantidade de usuários
    # - SQLModel já entende e integra esse modelo com o banco via ORM


# Modelo de ambiente (Salas comuns, de TI, laboratorios e etc)
class TipoAmbiente(str, Enum):
    sala = "sala"
    ead = "ead"
    reuniao_fablab = "reunião fablab"
    sala_oficina = "sala de oficina"
    auditorio = "auditorio"
    biblioteca = "biblioteca"
    # TI
    ti = "ti"
    # Eletrica
    elet_predial = "elétrica predial"
    elet_industrial = "elétrica industrial"
    elet_comandos = "eletrica comandos"
    eletrotecnica = "eletrotécnica"
    # Automação
    auto = "automação"
    auto_instrumentacao = "automação instrumentação"
    auto_eletronica = "automação eletrônica"
    auto_ind = "automação ind. 4.0"
    # Mecânica
    mec_hidraulica = "mecânica hidráulica"
    mec_pneumatica = "mecânica pneumática"
    mec_metrologia = "mecânica metrologia"
    # Petroquimica (Quimica)
    quimica = "quimica"
    # Oficina
    ofic_solda = "oficina solda"
    ofic_calderaria = "oficina calderaria"
    ofic_marcenaria = "oficina marcenaria"
    ofic_usinagem = "oficina usinagem"
    ofic_manutencao = "oficina manutenção"
    ofic_polimeros = "oficina polimeros"
    # Fablab
    fablab = "fablab"
    # Confecção
    confec_costura = "confecção costura"
    confec_model = "confecção sala de modelagem"
    # Energias Renováveis
    energ_lab = "energias renováveis laboratorio"
    energ_fotovoltaica = "energias renováveis fotovoltaica"
    energ_lab_sala = "energias renováveis laboratorio e sala" # conferir se é isso mesmo
    energ_preacelera = "energias renováveis preacelera" # conferir se o nome é mesmo esse
    # Logística
    logistica = "logística"

class Ambiente(SQLModel, table=True):
    id: Optional[int] = Field(primary_key=True)
    nome: str
    capacidade: int 
    descricao: str
    tipo_ambiente: TipoAmbiente
    ativo: bool = Field(default=True) # ativo por padrão, até que coloquem como inativo
    tv: bool
    projetor: bool
    ar_condicionado: bool
    # Relacionamento inverso (uma Ambiente pode ter muitas Reservas)
    reservas: List["Reserva"] = Relationship(back_populates="ambiente")


# Modelo de Reservas
class StatusReserva(str, Enum):
    CONFIRMADA = "confirmada"
    PENDENTE = "pendente"
    CANCELADA = "cancelada"
    FINALIZADA = "finalizada"

class Reserva(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Chaves estrangeiras (relacionamentos)
    ambiente_id: int = Field(foreign_key="ambiente.id", index=True)  # Indexação
    usuario_id: uuid.UUID = Field(foreign_key="usuario.id", index=True)
    
    # Datas e horários
    data_inicio: datetime = Field(index=True)  # Quando a reserva começa
    data_fim: datetime = Field(index=True)   # Quando a reserva termina
    data_criacao: datetime = Field(default_factory=datetime.now)  # Data da solicitação
    
    # Status e metadados
    status: StatusReserva = Field(default=StatusReserva.PENDENTE)
    motivo: str = Field(max_length=100)  # Ex: "Aula de Circuitos Digitais"
    
    # Relacionamentos (opcional, mas útil para queries)
    ambiente: "Ambiente" = Relationship(back_populates="reservas")
    usuario: "Usuario" = Relationship(back_populates="reservas")

class HistoricoReserva(SQLModel, table=True):
    # Tabela de histórico (cópia de reservas passadas)
    id: int = Field(primary_key=True)  # Pode ser o mesmo ID da reserva original
    ambiente_id: int  # Sem FK, pois o ambiente pode ter sido deletado
    usuario_id: uuid.UUID   # Sem FK, pois o usuário pode ter sido deletado
    data_inicio: datetime
    data_fim: datetime
    data_criacao: datetime
    status: StatusReserva
    motivo: str