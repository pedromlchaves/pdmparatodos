from sqlalchemy import Column, Integer, String, Text, Float, create_engine
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user = Column(String, nullable=False)
    coordinates = Column(ARRAY(Float), nullable=False)
    municipality = Column(String, nullable=False)
    question = Column(Text, nullable=False)
    articles = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)


DATABASE_URL = os.getenv("DATABASE_URL")
logging.info(f"Connecting to database at {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)
