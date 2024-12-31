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
import time
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Define the WMS service URL
WMS_URL = "https://geopdm.cm-porto.pt/services/pdm/wms"
WMS_VERSION = "1.1.1"
DEFAULT_MARGIN = 0.001
IMAGE_WIDTH = 800
IMAGE_HEIGHT = 600
INFO_FORMAT = "application/json"


class Coordinates(BaseModel):
    lat: float
    lon: float
    margin: float = DEFAULT_MARGIN


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

    return {"articles": articles, "answer": response}


@app.get("/layers/", response_model=List[str])
async def get_layers():
    """
    Get the list of available layers from the WMS service.

    Returns:
        List[str]: A list of layer names available in the WMS service.
    """
    wms = WebMapService(WMS_URL, version=WMS_VERSION)

    return list(wms.contents.keys())


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
    wms = WebMapService(WMS_URL, version=WMS_VERSION)

    if layer_name not in wms.contents:
        raise HTTPException(status_code=404, detail="Layer not found")

    layer = wms.contents[layer_name]
    layer_info = {
        "keywords": layer.keywords,
        "title": layer.title,
        "name": layer.name,
        "boundingBoxWGS84": layer.boundingBoxWGS84,
    }

    return layer_info


@app.post("/get_properties/")
async def get_properties(coords: Coordinates, layer_name: str = None):
    """
    Get properties for the given coordinates from the WMS service.
    """
    wms = WebMapService(WMS_URL, version=WMS_VERSION)

    # Calculate custom bounding box around the coordinate of interest
    min_lon = coords.lon - coords.margin
    max_lon = coords.lon + coords.margin
    min_lat = coords.lat - coords.margin
    max_lat = coords.lat + coords.margin

    # Create the bounding box parameter
    bbox_parameter = f"{min_lon},{min_lat},{max_lon},{max_lat}"

    # List to store all properties data
    all_properties = {}

    # Determine which layers to query
    layers_to_query = [layer_name] if layer_name else wms.contents.keys()

    # Iterate through each layer in the service
    for layer_name in layers_to_query:

        layer_metadata = wms.contents[layer_name]

        # Retrieve the bounding box for each layer
        bounding_box = layer_metadata.boundingBoxWGS84

        min_lon, min_lat, max_lon, max_lat = bounding_box

        # Check if the point is within the bounding box
        if not (min_lon <= coords.lon <= max_lon and min_lat <= coords.lat <= max_lat):
            continue

        # Use this bounding box in your WMS GetFeatureInfo request
        params = {
            "service": "WMS",
            "version": WMS_VERSION,
            "request": "GetFeatureInfo",
            "layers": layer_name,  # Use the current layer name
            "query_layers": layer_name,
            "bbox": bbox_parameter,
            "width": IMAGE_WIDTH,  # Pixel width matching the new bounding box aspect ratio
            "height": IMAGE_HEIGHT,  # Pixel height matching the new bounding box aspect ratio
            "srs": "EPSG:4326",
            "x": IMAGE_WIDTH // 2,  # X coordinate in the middle of the image
            "y": IMAGE_HEIGHT // 2,  # Y coordinate in the middle of the image
            "info_format": INFO_FORMAT,
        }

        # Send the request and handle the response
        response = requests.get(WMS_URL, params=params)

        try:
            response_data = response.json()

            if layer_name not in all_properties:
                all_properties[layer_name] = []

            # Iterate through features and collect properties
            for feature in response_data.get("features", []):
                feature["properties"]["nome"] = wms.contents[layer_name].title
                feature["properties"]["abstract"] = wms.contents[layer_name].abstract
                all_properties[layer_name].append(feature["properties"])

        except:
            continue

    if not all_properties:
        raise HTTPException(
            status_code=404, detail="No properties found for the given coordinates"
        )

    return all_properties


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
