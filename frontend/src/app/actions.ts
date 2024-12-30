'use server'

interface Coordinates {
  lat: number;
  lon: number;
  margin: number;
}

const DEFAULT_MARGIN = 0.001; // You can adjust this value as needed

export async function getLocationInfo(lat: number, lon: number, layer_name?: string) {
  const coords: Coordinates = {
    lat,
    lon,
    margin: DEFAULT_MARGIN
  };

  try {
    // For now, we'll use a placeholder hardcoded response
    // In a real scenario, you would make an actual API call here
    // const response = await fetch('http://localhost:8000/get_properties/', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ coords, layer_name }),
    // });
    // const data = await response.json();

    // Placeholder hardcoded response
    const data = {
      properties: {
        name: "Sample Location",
        type: "Point of Interest",
        description: "This is a placeholder response for the selected coordinates.",
        coordinates: {
          latitude: lat,
          longitude: lon
        }
      },
      layer_info: layer_name ? { name: layer_name } : null
    };

    return data;
  } catch (error) {
    console.error('Error fetching location info:', error);
    return { error: 'Failed to fetch location information' };
  }
}

