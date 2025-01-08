from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import logging
from helpers.generator import Generator
from helpers.retriever import Retriever
from helpers.vectorizer import TextVectorizer
from helpers.wms import WMService
import time
from dotenv import load_dotenv
from jose import jwt, JWTError
from models import Response, SessionLocal, Base, engine
from sqlalchemy.orm import Session

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

            if auth_header:
                try:
                    # Extract the token from the "Bearer" scheme
                    token = auth_header.split(" ")[1]
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    scope["user"] = payload  # Add decoded user info to the scope
                except JWTError:
                    return JSONResponse(
                        status_code=401, content={"detail": "Invalid or missing token"}
                    )
            else:
                scope["user"] = None  # No token provided

        await self.app(scope, receive, send)


app = FastAPI()
app.add_middleware(JWTMiddleware)

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

    return {"articles": articles, "answer": response}


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
