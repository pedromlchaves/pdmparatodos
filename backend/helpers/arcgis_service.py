from arcgis.gis import GIS
from arcgis.features import FeatureLayer
from arcgis.geometry import Point, Geometry
from arcgis.geometry import filters
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed


class ArcGISService:
    def __init__(self, base_urls):
        self.base_urls = base_urls if isinstance(base_urls, list) else [base_urls]
        self.gis_services = [self.initialize_gis(url) for url in self.base_urls]
        self.feature_layers = [self.get_feature_layers(url) for url in self.base_urls]

    def initialize_gis(self, base_url):
        try:
            return GIS(base_url=base_url)
        except Exception as e:
            if "Access not allowed" in str(e):
                print(f"Access not allowed for layer (Error Code: 403)\n")
            else:
                print(f"An unexpected error occurred: {e}")
            return None

    def get_feature_layers(self, map_service_url):
        try:
            response = requests.get(map_service_url + "?f=pjson")
            service_data = response.json()

            feature_layers = []

            def process_layer(layer, processed_ids=None):
                if processed_ids is None:
                    processed_ids = set()

                if layer["id"] in processed_ids:
                    return

                if layer.get("type") == "FeatureLayer" and layer.get(
                    "queryable", False
                ):
                    feature_layers.append(
                        {
                            "id": layer["id"],
                            "name": layer["name"],
                            "url": f"{map_service_url}/MapServer/{layer['id']}",
                            "fields": [
                                field["name"] for field in layer.get("fields", [])
                            ],
                            "parentLayerId": layer.get("parentLayerId"),
                            "featureType": layer.get("featureType"),
                        }
                    )
                    processed_ids.add(layer["id"])

                if layer.get("type") == "GroupLayer" and "subLayerIds" in layer:
                    for sublayer_id in layer["subLayerIds"]:
                        sublayer = next(
                            (
                                l
                                for l in service_data["layers"]
                                if str(l["id"]) == str(sublayer_id)
                            ),
                            None,
                        )
                        if sublayer:
                            process_layer(sublayer, processed_ids)

            for layer in service_data.get("layers", []):
                process_layer(layer)

            return feature_layers
        except Exception as e:
            print(f"Error getting feature layers for {map_service_url}: {e}")
            return []

    def query_location(self, feature_layer, input_geometry):
        try:
            spatial_filter = filters.intersects(input_geometry)
            results = feature_layer.query(
                geometry=input_geometry,
                geometry_type="esriGeometryEnvelope",
                geometry_filter=spatial_filter,
                out_fields="*",
                return_geometry=True,
                out_sr=3763,
                in_sr=3763,
            )
            print(f"\033[93mLayer URL: {feature_layer.url}\033[0m")
            print(f"\033[93mGeometry: {input_geometry}\033[0m")
            return results
        except Exception as e:
            print(f"Error querying feature layer: {e}")
            print(f"Layer URL: {feature_layer.url}")
            print(f"Geometry: {input_geometry}")
            return None

    def get_properties(self, latitude, longitude, delta=10):
        point_geometry = Point(
            {"x": longitude, "y": latitude, "spatialReference": {"wkid": 3763}}
        )
        envelope_geometry = Geometry(
            {
                "xmin": longitude - delta,
                "ymin": latitude - delta,
                "xmax": longitude + delta,
                "ymax": latitude + delta,
                "spatialReference": {"wkid": 3763},
            }
        )
        search_geometry = envelope_geometry

        all_properties = {}

        for feature_layers in self.feature_layers:
            with ThreadPoolExecutor(max_workers=10) as executor:
                future_to_layer = {
                    executor.submit(
                        self.query_location, FeatureLayer(layer["url"]), search_geometry
                    ): layer
                    for layer in feature_layers
                }
                for future in as_completed(future_to_layer):
                    layer = future_to_layer[future]
                    try:
                        results = future.result()
                        if results and len(results.features) > 0:
                            all_properties[layer["name"]] = [
                                feature.attributes for feature in results.features
                            ]
                        else:
                            print(f"No results found in layer {layer['name']}")
                    except Exception as e:
                        print(f"Error processing layer {layer['name']}: {e}")

        return all_properties
