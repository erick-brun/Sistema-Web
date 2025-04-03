from sqlmodel import Session
from .models import Reserva

def criar_reserva(session: Session, reserva: Reserva):
    session.add(reserva)
    session.commit()
    session.refresh(reserva)
    return reserva
