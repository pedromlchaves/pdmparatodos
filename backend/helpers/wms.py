from owslib.wms import WebMapService
import requests
import json
from concurrent.futures import ThreadPoolExecutor

municipalities = json.load(open("data/municipalities_configs.json"))


class WMService:
    def __init__(self, municipality):

        self.municipality_params = municipalities[municipality]
        self.wms_url = self.municipality_params["wms_url"]
        self.wms_version = self.municipality_params["wms_version"]
        self.image_width = self.municipality_params["image_width"]
        self.image_height = self.municipality_params["image_height"]
        self.info_format = self.municipality_params["info_format"]

        self.wms = WebMapService(self.wms_url, version=self.wms_version)

    def get_properties(self, coords, layer_name=None):
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
        layers_to_query = [layer_name] if layer_name else self.wms.contents.keys()

        def fetch_layer_properties(layer_name):
            layer_metadata = self.wms.contents[layer_name]
            bounding_box = layer_metadata.boundingBoxWGS84
            min_lon, min_lat, max_lon, max_lat = bounding_box

            if not (
                min_lon <= coords.lon <= max_lon and min_lat <= coords.lat <= max_lat
            ):
                return None

            params = {
                "service": "WMS",
                "version": self.wms_version,
                "request": "GetFeatureInfo",
                "layers": layer_name,
                "query_layers": layer_name,
                "bbox": bbox_parameter,
                "width": self.image_width,
                "height": self.image_height,
                "srs": "EPSG:4326",
                "x": self.image_width // 2,
                "y": self.image_height // 2,
                "info_format": self.info_format,
            }

            response = requests.get(self.wms_url, params=params)
            try:
                response_data = response.json()
                properties = []
                for feature in response_data.get("features", []):
                    feature["properties"]["nome"] = self.wms.contents[layer_name].title
                    feature["properties"]["abstract"] = self.wms.contents[
                        layer_name
                    ].abstract
                    properties.append(feature["properties"])
                return layer_name, properties
            except:
                return None

        with ThreadPoolExecutor(max_workers=len(layers_to_query)) as executor:
            results = executor.map(fetch_layer_properties, layers_to_query)

        for result in results:
            if result:
                layer_name, properties = result
                all_properties[layer_name] = properties

        return all_properties

    def get_contents(self):
        return self.wms.contents
