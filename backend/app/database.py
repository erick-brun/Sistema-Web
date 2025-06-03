# Configura a conexão com o banco de dados (PostgreSQL).
# Define o engine e a função get_session() para usar nas rotas.

# =============================================
# Importações
# =============================================
from sqlmodel import SQLModel, create_engine, Session # Importa o necessário do SQLModel
import os  # Módulo padrão do Python para interagir com o sistema operacional

# =============================================
# Configuração da Conexão com o PostgreSQL
# =============================================
# Lê a URL de conexão do banco de dados da variável de ambiente DATABASE_URL.
# Esta variável deve ser definida no seu arquivo .env na raiz e passada para o contêiner backend via docker-compose.
DATABASE_URL = os.getenv("DATABASE_URL")

# Debug provisório: imprime a URL lida (REMOVER EM PRODUÇÃO!)
print("DATABASE_URL =", DATABASE_URL)

# Verificação básica se a variável de ambiente foi carregada.
if not DATABASE_URL:
    print("Erro: Variável de ambiente DATABASE_URL não encontrada no ambiente do contêiner.")
    # Considere levantar uma exceção aqui para falhar rapidamente se a variável não estiver definida.
    # raise EnvironmentError("Variável de ambiente DATABASE_URL não configurada.")


# =============================================
# Criação da Engine SQLAlchemy
# =============================================
# Cria a "engine" do SQLAlchemy, que é o ponto de partida para interagir com o banco de dados.
engine = create_engine(
    DATABASE_URL, # Usa a URL lida da variável de ambiente
    echo=True  # Ativa o log de todas as queries SQL executadas. EXCELENTE para debug em desenvolvimento.
               # MUDAR para False em produção por performance e segurança.
)

# =============================================
# Dependência para Obter Sessão de Banco
# =============================================
# Esta função geradora é uma "dependência" para as rotas do FastAPI.
# Ela fornece uma sessão de banco de dados que é fechada automaticamente após o uso.
def get_session():
    with Session(engine) as session:
        yield session # Fornece a sessão à rota que a injetou.
    # A sessão é fechada automaticamente quando o bloco 'with' termina.


# =============================================
# Inicialização das Tabelas do Banco (Apenas para desenvolvimento inicial)
# =============================================
# Função para criar todas as tabelas definidas nos modelos SQLModel
# que ainda não existem no banco de dados.
def init_db():

    print("Tentando criar tabelas do banco de dados (se não existirem)...")
    # SQLModel.metadata.create_all(engine) usa o metadata de TODAS as classes que herdam de SQLModel
    # e estão definidas e acessíveis no momento da chamada.

    SQLModel.metadata.create_all(engine)
    print("Tentativa de criação de tabelas finalizada.")

# Essa função 'init_db()':
# - É útil apenas para a configuração inicial do banco de dados em AMBIENTE DE DESENVOLVIMENTO.
# - Cria tabelas que não existem baseadas nos modelos definidos.
# - NÃO gerencia ALTERAÇÕES (adição/remoção de colunas, etc.) em tabelas existentes.
# - NÃO DEVE ser usada em PRODUÇÃO para aplicar mudanças no schema. Use Alembic para migrações em produção.