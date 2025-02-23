from arcgis.gis import GIS
from arcgis.features import FeatureLayer
from arcgis.geometry import Point, Geometry
from arcgis.geometry import filters
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed


def initialize_gis(base_url):
    try:
        return GIS(base_url=base_url)
    except Exception as e:
        if "Access not allowed" in str(e):
            print(f"Access not allowed for layer (Error Code: 403)\n")
        else:
            print(f"An unexpected error occurred: {e}")
        return None


def get_feature_layers(map_service_url):
    try:
        # Get the map service metadata
        response = requests.get(map_service_url + "?f=pjson")
        service_data = response.json()

        # Extract feature layer information
        feature_layers = []

        def process_layer(layer, processed_ids=None):
            # Initialize processed_ids set if not provided
            if processed_ids is None:
                processed_ids = set()

            # Skip if we've already processed this layer
            if layer["id"] in processed_ids:
                return

            # Add feature layers checking only for type and if they are queryable
            if layer.get("type") == "FeatureLayer" and layer.get("queryable", False):
                feature_layers.append(
                    {
                        "id": layer["id"],
                        "name": layer["name"],
                        "url": f"{map_service_url}/MapServer/{layer['id']}",  # MapServer, layers
                        "fields": [field["name"] for field in layer.get("fields", [])],
                        "parentLayerId": layer.get("parentLayerId"),
                        "featureType": layer.get("featureType"),
                    }
                )
                processed_ids.add(layer["id"])

            # Recursively process sublayers if it's a group layer
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

        # Process all layers
        for layer in service_data.get("layers", []):
            process_layer(layer)

        return feature_layers
    except Exception as e:
        print(f"Error getting feature layers for {map_service_url}: {e}")
        return []


def query_location(feature_layer, input_geometry):
    try:
        # Match the exact parameter structure from the working URL
        spatial_filter = filters.intersects(input_geometry)
        results = feature_layer.query(
            geometry=input_geometry,
            geometry_type="esriGeometryEnvelope",
            geometry_filter=spatial_filter,
            # spatial_rel='esriSpatialRelIntersects',
            out_fields="*",
            return_geometry=True,
            out_sr=3763,
            in_sr=3763,
        )

        # print in yellow these intermediate steps
        print(f"\033[93mLayer URL: {feature_layer.url}\033[0m")
        print(f"\033[93mGeometry: {input_geometry}\033[0m")
        return results

    except Exception as e:
        print(f"Error querying feature layer: {e}")
        print(f"Layer URL: {feature_layer.url}")
        print(f"Geometry: {input_geometry}")
        return None


def main():
    # Create a single file name with timestamp at the start
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"results_{timestamp}.txt"

    # Map service URLs
    map_service_urls = [
        "https://websig.cm-lisboa.pt/MuniSIG/REST/sites/LxInterativa/map/mapservices/40"
    ]

    # Define test location in Praça do Comércio using EPSG:3763 coordinates
    latitude = -106167.77642
    longitude = -87276.21311

    # You can use either Point or Envelope geometry:
    # Option 1: Point geometry (remember to change query's parameters to point)
    point_geometry = Point(
        {"x": longitude, "y": latitude, "spatialReference": {"wkid": 3763}}
    )

    # Option 2: Envelope geometry (buffer around point)
    delta = 10  # 10 meters buffer in EPSG:3763
    envelope_geometry = Geometry(
        {
            "xmin": longitude - delta,
            "ymin": latitude - delta,
            "xmax": longitude + delta,
            "ymax": latitude + delta,
            "spatialReference": {"wkid": 3763},
        }
    )

    # Choose which geometry to use
    search_geometry = envelope_geometry  # point_geometry or envelope_geometry

    # Open the file once before processing layers
    for service_url in map_service_urls:
        print(f"\n\033[94m------>Processing Map Service: {service_url}\033[0m")

        # Initialize GIS for this service
        gis = initialize_gis(service_url)
        if not gis:
            print(f"\033[91mError initializing GIS for {service_url}\033[0m")  # in red
            continue

        # Get feature layers for this service
        feature_layers = get_feature_layers(service_url)

        # Process each feature layer
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_layer = {
                executor.submit(
                    query_location, FeatureLayer(layer["url"]), search_geometry
                ): layer
                for layer in feature_layers
            }
            for future in as_completed(future_to_layer):
                layer = future_to_layer[future]
                try:
                    results = future.result()

                    if len(results.features) > 0:
                        print(f"Found results in layer {layer['name']}:")

                        for feature in results.features:
                            print(feature.attributes)

                    else:
                        print(f"No results found in layer {layer['name']}")

                except Exception as e:
                    print(f"Error processing layer {layer['name']}: {e}")

    print(f"\nResults have been saved to {output_file}")


if __name__ == "__main__":
    main()
