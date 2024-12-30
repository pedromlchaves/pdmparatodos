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
    const response = await fetch('http://backend:8000/get_properties/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(coords),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching location info:', error);
    return { error: 'Failed to fetch location information' };
  }
}

