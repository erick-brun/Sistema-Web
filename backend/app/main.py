from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2PasswordBearer
from app.routers import usuarios
from app.database import engine, init_db
from sqlmodel import SQLModel

app = FastAPI()

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar tabelas ao iniciar a aplicação
@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {"message": "API de Reservas funcionando!"}



# Registre suas rotas aqui
from app.routers import usuarios
app.include_router(usuarios.router)

# 🔒 Configurar segurança OAuth2 no Swagger
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Sistema de Reservas",
        version="1.0.0",
        description="API do sistema de reservas com autenticação JWT",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/usuarios/login",
                    "scopes": {}
                }
            }
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi