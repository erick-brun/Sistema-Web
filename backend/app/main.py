# Arquivo principal da aplicação FastAPI.
# Responsável por criar a instância do app e incluir as rotas.

# =============================================
# Importações principais do FastAPI
# =============================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Para lidar com CORS
from fastapi.openapi.utils import get_openapi  # Para documentação OpenAPI customizada

# =============================================
# Importações internas 
# =============================================
from app.routers import usuarios  # Importa o router de usuários
from app.routers import ambientes  # Importa o router de ambientes
from app.routers import reservas  # Importa o router de reservas
from app.database import init_db  # Importa a função de inicialização do banco de dados
# Importa os modelos explicitamente para garantir que SQLModel os "encontre" para create_all
# Mesmo que não use diretamente as classes aqui, esta importação garante que elas sejam carregadas.
from app.models import Usuario, Ambiente, Reserva, HistoricoReserva

# =============================================
# Configuração do Logger (Para logs no evento startup, etc.)
# =============================================
import logging # Importa o módulo de logging padrão
# Configuração básica do logger para o console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================
# Cria a instância principal da aplicação FastAPI
# =============================================
app = FastAPI(
    # Opcional: Adicione metadados padrão aqui (title, version, description)
    # title="Sistema de Reservas",
    # version="1.0.0",
    # description="API do sistema de reservas com autenticação JWT",
)


# =============================================
# Configuração de CORS (Cross-Origin Resource Sharing)
# Permite comunicação segura entre frontend e backend
# =============================================
app.add_middleware(
    CORSMiddleware,
    # Permite requisições de http://localhost:3000 (frontend React em desenvolvimento)
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,  # Permite cookies, cabeçalhos de autorização, etc.
    allow_methods=["*"],  # Permite todos os métodos HTTP (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permite todos os cabeçalhos (incluindo Content-Type, Authorization, etc.)
)

# =============================================
# Evento de Inicialização (Executado ao iniciar o servidor)
# =============================================
@app.on_event("startup")
def startup_event():
    """Executa tarefas na inicialização da aplicação (ex: inicializar DB)."""
    logger.info("Inicializando banco de dados...")
    # Chama a função para criar tabelas se não existirem (ambiente de desenvolvimento)
    init_db()
    logger.info("Banco de dados pronto.")

# =============================================
# Rota Raiz (Health Check Simples)
# =============================================
@app.get("/", tags=["root"]) # tag para organização no Swagger
def read_root():
    """Endpoint básico para verificar se a API está online."""
    return {"message": "API de Reservas funcionando!"}

# =============================================
# Registro de Rotas (Inclusão dos APIRouters)
# =============================================
# Inclui o router de usuários.
app.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])

# Define o prefixo /ambientes para todas as rotas dentro do router de ambientes.
app.include_router(ambientes.router, prefix="/ambientes", tags=["ambientes"])

# Inclui o router de reservas
# Define o prefixo /reservas para todas as rotas dentro do router de reservas.
app.include_router(reservas.router, prefix="/reservas", tags=["reservas"])


# TODO: Se tiver outros routers no futuro, incluir aqui.


# =============================================
# Configuração Avançada da Documentação OpenAPI/Swagger
# (Para configurar o botão Authorize para JWT)
# =============================================
def custom_openapi():
    """
    Gera e customiza o schema OpenAPI para a documentação interativa (Swagger UI).
    Adiciona a configuração para autenticação JWT (OAuth2 Password Bearer).
    """
    # Cacheia o schema gerado para evitar re-gerar em cada requisição
    if app.openapi_schema:
        return app.openapi_schema

    # Gera o schema base da aplicação a partir das rotas e seus decoradores
    openapi_schema = get_openapi(
        # definindo title, version, description na instância do FastAPI, defina aqui:
        title="Sistema de Reservas",
        version="1.0.0",
        description="API do sistema de reservas com autenticação JWT (FastAPI, SQLModel, PostgreSQL)",
        routes=app.routes, # Pega todas as rotas incluídas
    )

    # Define o esquema de segurança OAuth2 Password Bearer para o Swagger.
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": { 
            "type": "oauth2",
            "flows": { 
                "password": {
                    "tokenUrl": "/usuarios/login", # Endpoint onde obter o token
                    "scopes": {} # Deixar vazio se não usar scopes
                }
            },
            "description": "Autenticação via token JWT. Obtenha o token em /usuarios/login." # Descrição para o usuário
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Atribui a função de customização ao atributo openapi do app.
# FastAPI a usará para gerar a documentação interativa em /docs.
app.openapi = custom_openapi
