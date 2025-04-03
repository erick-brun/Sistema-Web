from sqlmodel import SQLModel, Field
from typing import Optional

class Reserva(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sala: str
    data: str
    horario: str
    professor: str
