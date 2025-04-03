from pydantic import BaseModel

class ReservaCreate(BaseModel):
    sala: str
    data: str
    horario: str
    professor: str
