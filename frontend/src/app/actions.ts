'use server'

interface Coordinates {
  lat: number;
  lon: number;
  margin: number;
  municipality: string;
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

// We only define this inside docker, outside we go for default
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function getLocationInfo(lat: number, lon: number, municipality: string, layer_name?: string) {
  const coords: Coordinates = {
    lat,
    lon,
    margin: DEFAULT_MARGIN,
    municipality
  };

  try {
    const response = await fetch(`${BACKEND_URL}/get_properties/`, {
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
    const response = await fetch(`${BACKEND_URL}/ask_question/`, {
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
