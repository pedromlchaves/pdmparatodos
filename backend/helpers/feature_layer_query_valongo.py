from arcgis.gis import GIS
from arcgis.features import FeatureLayer
from arcgis.geometry import Point, Geometry
from arcgis.geometry import filters
import requests

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
        response = requests.get(map_service_url + "?f=json")
        service_data = response.json()
        
        # Extract feature layer information
        feature_layers = []
        for layer in service_data["layers"]:
            if layer["type"] == "Feature Layer":
                feature_layers.append({
                    "id": layer["id"],
                    "name": layer["name"],
                    "url": f"{map_service_url}/{layer['id']}"
                })
        return feature_layers
    except Exception as e:
        print(f"Error getting feature layers for {map_service_url}: {e}")
        return []

def query_location(feature_layer, test_location, envelope, spatial_filter):
    try:
        results = feature_layer.query(
            geometry=envelope,
            geometry_filter=spatial_filter,
            geometry_type="esriGeometryEnvelope",
            spatial_reference={"wkid": 4326},
            as_df=True,
            out_fields="*"
        )
        return results
    except Exception as e:
        print(f"Error querying feature layer: {e}")
        return None

def main():
    # Map service URLs
    map_service_urls = [
        "https://sig.cm-valongo.pt/arcgis/rest/services/MuniSIG/Plt_Ordenamento1/MapServer",
        "https://sig.cm-valongo.pt/arcgis/rest/services/MuniSIG/Plt_Ordenamento2/MapServer",
        "https://sig.cm-valongo.pt/arcgis/rest/services/MuniSIG/Plt_Ordenamento3/MapServer",
        "https://sig.cm-valongo.pt/arcgis/rest/services/MuniSIG/Plt_Ordenamento4/MapServer",
        "https://sig.cm-valongo.pt/arcgis/rest/services/MuniSIG/Plt_Condicionantes1/MapServer",
        "https://sig.cm-valongo.pt/arcgis/rest/services/MuniSIG/Plt_Condicionantes2/MapServer",
        "https://sig.cm-valongo.pt/arcgis/rest/services/MuniSIG/Plt_Condicionantes3/MapServer"
    ]

    # Define test location in Valongo
    latitude = 41.19532
    longitude = -8.49872

    # Create geometry objects
    test_location = Point({"x": longitude, "y": latitude})
    delta = 0.00009  # ~10 meters
    envelope = Geometry({
        "xmin": longitude - delta,
        "ymin": latitude - delta,
        "xmax": longitude + delta,
        "ymax": latitude + delta,
        "spatialReference": {"wkid": 4326}
    })
    spatial_filter = filters.intersects(envelope)

    # Iterate through each map service
    for service_url in map_service_urls:
        print(f"\n\033[94m------>Processing Map Service: {service_url}\033[0m")
        
        # Initialize GIS for this service
        gis = initialize_gis(service_url)
        if not gis:
            continue

        # Get feature layers for this service
        feature_layers = get_feature_layers(service_url)
        
        # Process each feature layer
        for layer in feature_layers:
            print(f"\n\033[92m----->Querying Layer: {layer['name']} (ID: {layer['id']})\033[0m")
            
            # Create feature layer object
            feature_layer = FeatureLayer(layer['url'])
            
            # Query the location
            results = query_location(feature_layer, test_location, envelope, spatial_filter)
            
            if results is not None and not results.empty:
                print(f"Found results in layer {layer['name']}:")
                print(results)
            else:
                print(f"No results found in layer {layer['name']}")

if __name__ == "__main__":
    main()

