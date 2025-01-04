from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from owslib.wms import WebMapService
import pandas as pd
from typing import List
import requests
import os
from helpers.generator import Generator
from helpers.retriever import Retriever
from helpers.vectorizer import TextVectorizer
from helpers.wms import WMService
import time
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

DEFAULT_MARGIN = 0.001


class Coordinates(BaseModel):
    lat: float
    lon: float
    margin: float = DEFAULT_MARGIN
    municipality: str = "Porto"


api_key = os.getenv("MISTRAL_API_KEY")

vectorizer = TextVectorizer(api_key=api_key)

retriever = Retriever("data/artigos_embeddings.faiss", vectorizer)

enriched_articles = open("data/enriched_articles.txt").read().split("\n\n")

generator = Generator(api_key=api_key, model="mistral-large-latest")


class QuestionRequest(BaseModel):
    question: str
    properties: dict


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

    for layer in layers_formatted:
        relevant_chunks = retriever.retrieve(layer, enriched_articles, k=5)
        all_relevant_chunks.extend(relevant_chunks)
        time.sleep(2)

    return all_relevant_chunks


def get_article_page(article, pdf):
    return


@app.post("/ask_question/")
async def ask_question(request: QuestionRequest):
    """
    Answer a question based on the given coordinates and context.

    Args:
        request (QuestionRequest): The question and coordinates.

    Returns:
        dict: The generated response.
    """

    parsed_properties = parse_properties_for_model(request.properties)

    layers_formatted = "\n".join(parsed_properties)

    relevant_chunks = get_all_relevant_chunks(parsed_properties)

    prompt = generator.generate_prompt(
        layers_formatted, relevant_chunks, request.question
    )

    print(prompt)

    articles = [x.splitlines()[2] for x in relevant_chunks]

    response = generator.generate(prompt)

    print(response)

    return {"articles": articles, "answer": response}


@app.get("/layers/{municipality}")
async def get_layers():
    """
    Get the list of available layers from the WMS service.

    Returns:
        List[str]: A list of layer names available in the WMS service.
    """
    wms = WMService(municipality="Porto")
    contents = wms.get_contents()
    return list(contents.keys())


@app.get("/layer_info/{layer_name}")
async def get_layer_info(layer_name: str):
    """
    Get the attributes of a specific layer from the WMS service.

    Args:
        layer_name (str): The name of the layer to retrieve information for.

    Returns:
        dict: A dictionary containing the layer's keywords, title, name, and bounding box in WGS84 coordinates.

    Raises:
        HTTPException: If the layer is not found in the WMS service.
    """
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
async def get_properties(coords: Coordinates):
    """
    Get properties for the given coordinates from the relevant WMS service.
    """
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
