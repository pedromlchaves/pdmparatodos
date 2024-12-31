'use server'

interface Coordinates {
  lat: number;
  lon: number;
  margin: number;
}

interface QuestionResponse {
  articles: string[];
  answer: string;
}

interface QuestionRequest {
  question: string;
  properties: LocationProperties;
}

interface LocationItem {
  [key: string]: any; // This allows for any key-value pair since layer properties can vary
}

interface LocationLayer {
  [key: string]: LocationItem[];
}
interface LocationProperties {
  [key: string]: LocationLayer;
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


  const data: LocationProperties = await response.json();

  return data;
  } catch (error) {
    console.error('Error fetching location info:', error);
    return { error: 'Failed to fetch location information' };
  }
}

export async function askQuestion(question: string, properties: LocationProperties): Promise<QuestionResponse> {
  const q: QuestionRequest = {
   question,
   properties
  };

  try {
    const response = await fetch('http://backend:8000/ask_question/', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify(q),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: QuestionResponse = await response.json();
    return data;

  } catch (error) {
    console.error("Error in askQuestion:", error);
    throw error; // Re-throw the error to be handled by the client
  }
}
