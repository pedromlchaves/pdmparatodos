from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import logging
from helpers.generator import Generator
from helpers.retriever import Retriever
from helpers.vectorizer import TextVectorizer
from helpers.wms import WMService
from datetime import datetime
from dotenv import load_dotenv
from jose import jwt, JWTError
from models import Response, UserRequestCount, SessionLocal, Base, engine
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

SECRET_KEY = os.getenv("NEXTAUTH_SECRET")
ALGORITHM = "HS256"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the database tables if they do not already exist
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class JWTMiddleware:
    def __init__(self, app: FastAPI):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            auth_header = request.headers.get("Authorization")
            logging.info("Auth header:")
            logging.info(auth_header)
            if auth_header:
                try:
                    # Extract the token from the "Bearer" scheme
                    token = auth_header.split(" ")[1]
                    logging.info(token)
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    logging.info(payload)
                    scope["user"] = payload  # Add decoded user info to the scope

                except Exception as e:
                    # Respond with an HTTP 401 error
                    response = JSONResponse(
                        status_code=401, content={"detail": "Invalid or expired token"}
                    )
                    await response(scope, receive, send)
                    return
            else:
                # Respond with an HTTP 401 error
                response = JSONResponse(
                    status_code=401, content={"detail": "Authorization header missing"}
                )
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)


app = FastAPI()

app.add_middleware(JWTMiddleware)

# Configure CORS
origins = [
    "*",
    # Add other origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DEFAULT_MARGIN = 0.001


api_key = os.getenv("MISTRAL_API_KEY")

vectorizer = TextVectorizer(api_key=api_key)

retriever = Retriever("data/artigos_embeddings.faiss", vectorizer)

enriched_articles = open("data/enriched_articles.txt").read().split("\n\n")

generator = Generator(api_key=api_key, model="mistral-large-latest")


class Coordinates(BaseModel):
    lat: float
    lon: float
    margin: float
    municipality: str


class QuestionRequest(BaseModel):
    question: str
    properties: dict
    coords: Coordinates


class ChatRequest(BaseModel):
    messages: list


def parse_properties_for_model(properties):
    property_values = [x[0] for x in list(properties.values()) if x != []]

    pdm_properties = [
        property for property in property_values if property["abstract"] == "PDM 2021"
    ]

    concatenated_properties_list = [
        " - ".join(
            str(value)
            for key, value in d.items()
            if key not in ["abstract", "nome", "uuid", "id_objeto"]
        )
        for d in pdm_properties
    ]

    return concatenated_properties_list


def get_all_relevant_chunks(layers_formatted):
    all_relevant_chunks = []

    all_relevant_chunks = retriever.retrieve(layers_formatted, enriched_articles, k=5)

    return all_relevant_chunks


@app.post("/ask_question/")
async def ask_question(
    request: Request, question_request: QuestionRequest, db: Session = Depends(get_db)
):
    """
    Answer a question based on the given coordinates and context.

    Args:
        question_request (QuestionRequest): The question and coordinates.

    Returns:
        dict: The generated response.
    """

    user = request.scope.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    parsed_properties = parse_properties_for_model(question_request.properties)

    layers_formatted = "\n".join(parsed_properties)

    relevant_chunks = get_all_relevant_chunks(parsed_properties)

    logger.info("Generating prompt...")

    prompt = generator.generate_prompt(
        layers_formatted, relevant_chunks, question_request.question
    )

    articles = [x.splitlines()[2] for x in relevant_chunks]

    logger.info("Generating response...")
    response = generator.generate(prompt)

    logger.info("Saving response to database...")
    db_response = Response(
        user=user["id"],
        question=question_request.question,
        coordinates=[
            question_request.coords.lat,
            question_request.coords.lon,
        ],
        municipality=question_request.coords.municipality,
        articles="\n".join(articles),
        answer=response,
    )

    db.add(db_response)
    db.commit()
    db.refresh(db_response)

    # Update the user's request count logic
    user_id = user["id"]  # user["id"] should correspond to Prisma's user ID

    # Fetch or create UserRequestCount for this user
    user_request_count = (
        db.query(UserRequestCount).filter(UserRequestCount.user_id == user_id).first()
    )

    if not user_request_count:
        # If the user doesn't have an entry, create one
        user_request_count = UserRequestCount(
            user_id=user_id, questions_asked=0, last_reset=datetime.utcnow()
        )
        db.add(user_request_count)
        db.commit()

    # Reset the count if the month has changed
    user_request_count.reset_count_if_needed()

    # Check if the user has exceeded the question limit

    if user_request_count.questions_asked >= user_request_count.limit:
        raise HTTPException(
            status_code=403,
            detail="You have reached the maximum number of questions for this month. Please try again next month.",
        )

    # Increment the number of questions asked
    user_request_count.questions_asked += 1
    db.commit()

    return {"articles": articles, "answer": response}


@app.post("/chat_streaming/")
async def chat_streaming(
    request: Request, chat_request: ChatRequest, db: Session = Depends(get_db)
):
    """
    Answer a question based on the given coordinates and context using streaming.

    Args:
        message (ChatRequest): The message sent by the user.

    Returns:
        dict: The generated response.
    """
    logging.info(chat_request)
    user = request.scope.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    message = "Quais as condicionantes de edificabilidade para frente urbano de tipo I?"
    relevant_chunks = get_all_relevant_chunks(message)

    logger.info("Generating prompt...")

    prompt = generator.generate_chat_prompt(relevant_chunks, message)

    logger.info("Generating response...")

    response = generator.generate_chat_streaming(prompt)

    return response


@app.get("/request_count/")
async def get_request_count(request: Request, db: Session = Depends(get_db)):
    """
    Get the request count for the authenticated user.

    Returns:
        dict: The request count and limit for the user.
    """
    user = request.scope.get("user")
    logging.info(user)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user_id = user["id"]
    logging.info(user_id)
    user_request_count = (
        db.query(UserRequestCount).filter(UserRequestCount.user_id == user_id).first()
    )

    logging.info(user_request_count)
    if not user_request_count:
        raise HTTPException(status_code=404, detail="Request count not found for user")

    return {
        "questions_asked": user_request_count.questions_asked,
        "limit": user_request_count.limit,
        "last_reset": user_request_count.last_reset,
    }


@app.get("/responses/")
async def get_responses(request: Request, db: Session = Depends(get_db)):
    """
    Retrieve responses from the Response table based on the user ID extracted from the token.

    Returns:
        List[Response]: A list of responses for the authenticated user.
    """
    logging.info("Request authentication info:")
    logging.info(request.scope.get("user"))
    user = request.scope.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user_id = user["id"]
    responses = db.query(Response).filter(Response.user == user_id).all()

    return responses


@app.get("/layers/{municipality}")
async def get_layers(request: Request):
    """
    Get the list of available layers from the WMS service.

    Returns:
        List[str]: A list of layer names available in the WMS service.
    """

    user = request.scope.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    wms = WMService(municipality="Porto")
    contents = wms.get_contents()
    return list(contents.keys())


@app.get("/layer_info/{layer_name}")
async def get_layer_info(layer_name: str, request: Request):
    """
    Get the attributes of a specific layer from the WMS service.

    Args:
        layer_name (str): The name of the layer to retrieve information for.

    Returns:
        dict: A dictionary containing the layer's keywords, title, name, and bounding box in WGS84 coordinates.

    Raises:
        HTTPException: If the layer is not found in the WMS service.
    """
    user = request.scope.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    wms = WMService(municipality="Porto")
    contents = wms.get_contents()

    if layer_name not in contents:
        raise HTTPException(status_code=404, detail="Layer not found")

    layer = contents[layer_name]
    layer_info = {
        "keywords": layer.keywords,
        "title": layer.title,
        "name": layer.name,
        "boundingBoxWGS84": layer.boundingBoxWGS84,
    }

    return layer_info


@app.post("/get_properties/")
async def get_properties(coords: Coordinates, request: Request):
    """
    Get properties for the given coordinates from the relevant WMS service.
    """

    user = request.scope.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    wms_service = WMService(coords.municipality)

    all_properties = wms_service.get_properties(coords)

    if not all_properties:
        raise HTTPException(
            status_code=404, detail="No properties found for the given coordinates"
        )

    return all_properties


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
