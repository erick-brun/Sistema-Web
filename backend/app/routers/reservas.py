from fastapi import APIRouter, Depends
from sqlmodel import Session
from ..database import get_session
from ..models import Reserva
from ..schemas import ReservaCreate
from ..crud import criar_reserva

router = APIRouter(prefix="/reservas", tags=["reservas"])

@router.post("/")
def criar_nova_reserva(reserva: ReservaCreate, session: Session = Depends(get_session)):
    nova_reserva = Reserva(**reserva.dict())
    return criar_reserva(session, nova_reserva)

@router.get("/")
def listar_reservas(session: Session = Depends(get_session)):
    return session.query(Reserva).all()
