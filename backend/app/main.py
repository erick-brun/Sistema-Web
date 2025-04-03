from fastapi import FastAPI
from .routers import reservas

app = FastAPI()

# Incluir as rotas
app.include_router(reservas.router)

@app.get("/")
def read_root():
    return {"message": "API de Reservas funcionando!"}


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Pode trocar "*" por ["http://localhost:3000"] para mais segurança
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
