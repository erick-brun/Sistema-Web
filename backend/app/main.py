from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Rotas
# app.include_router(reservas.router)
app.include_router(usuarios.router)

@app.get("/")
def read_root():
    return {"message": "API de Reservas funcionando!"}



