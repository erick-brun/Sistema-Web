from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "postgresql://admin:admin@postgres_db:5432/reservas"  # Certifique-se de que este é o nome correto do container

engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
