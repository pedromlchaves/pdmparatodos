from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    create_engine,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging
from sqlalchemy.orm import relationship
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()


DATABASE_URL = os.getenv("DATABASE_URL")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user = Column(String, nullable=False)
    coordinates = Column(ARRAY(Float), nullable=False)
    municipality = Column(String, nullable=False)
    question = Column(Text, nullable=False)
    articles = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)


class UserRequestCount(Base):
    __tablename__ = "user_request_count"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String)  # String type to match Prisma User model
    questions_asked = Column(Integer, default=0)
    last_reset = Column(DateTime, default=datetime.utcnow)
    limit = Column(Integer, default=100)

    def reset_count_if_needed(self):
        """Reset the question count if it's a new month."""
        current_month = datetime.utcnow().month
        if self.last_reset.month != current_month:
            self.questions_asked = 0
            self.last_reset = datetime.utcnow()


logging.info(f"Connecting to database at {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)
