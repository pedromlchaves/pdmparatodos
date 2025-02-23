import unittest
from arcgis_service import ArcGISService


class TestArcGISService(unittest.TestCase):
    def setUp(self):
        # Initialize the ArcGISService with the provided URL
        self.arcgis_service = ArcGISService(
            base_urls=[
                "https://websig.cm-lisboa.pt/MuniSIG/REST/sites/LxInterativa/map/mapservices/40"
            ]
        )

    def test_query_location_praca_do_comercio(self):
        # Coordinates for Praça do Comércio using EPSG:3763
        latitude = -106167.77642
        longitude = -87276.21311

        # Call the get_properties method with the coordinates
        properties = self.arcgis_service.get_properties(latitude, longitude)

        # Check if properties are returned
        self.assertIsNotNone(properties)
        self.assertTrue(
            len(properties) > 0, "No properties found for the given location"
        )

        # Print the properties for manual inspection
        print(properties)


if __name__ == "__main__":
    unittest.main()
