from owslib.wms import WebMapService
import requests
import json

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

        # Iterate through each layer in the service
        for layer_name in layers_to_query:
            layer_metadata = self.wms.contents[layer_name]

            # Retrieve the bounding box for each layer
            bounding_box = layer_metadata.boundingBoxWGS84

            min_lon, min_lat, max_lon, max_lat = bounding_box

            # Check if the point is within the bounding box
            if not (
                min_lon <= coords.lon <= max_lon and min_lat <= coords.lat <= max_lat
            ):
                continue

            # Use this bounding box in your WMS GetFeatureInfo request
            params = {
                "service": "WMS",
                "version": self.wms_version,
                "request": "GetFeatureInfo",
                "layers": layer_name,  # Use the current layer name
                "query_layers": layer_name,
                "bbox": bbox_parameter,
                "width": self.image_width,  # Pixel width matching the new bounding box aspect ratio
                "height": self.image_height,  # Pixel height matching the new bounding box aspect ratio
                "srs": "EPSG:4326",
                "x": self.image_width // 2,  # X coordinate in the middle of the image
                "y": self.image_height // 2,  # Y coordinate in the middle of the image
                "info_format": self.info_format,
            }

            # Send the request and handle the response
            response = requests.get(self.wms_url, params=params)

            try:
                response_data = response.json()

                if layer_name not in all_properties:
                    all_properties[layer_name] = []

                # Iterate through features and collect properties
                for feature in response_data.get("features", []):
                    feature["properties"]["nome"] = self.wms.contents[layer_name].title
                    feature["properties"]["abstract"] = self.wms.contents[
                        layer_name
                    ].abstract
                    all_properties[layer_name].append(feature["properties"])

            except:
                continue

        return all_properties

    def get_contents(self):
        return self.wms.contents
