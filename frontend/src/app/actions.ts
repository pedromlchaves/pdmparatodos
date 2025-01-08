'use server'
import { QuestionResponse } from "@/types" // Ensure this is the correct import

interface Coordinates {
  lat: number;
  lon: number;
  margin: number;
  municipality: string;
}

interface QuestionRequest {
  question: string;
  properties: LocationProperties;
  coords: Coordinates;
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
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const MAPS_API_KEY = process.env.MAPS_API_KEY as string;

export async function getLocationInfo(lat: number, lon: number, municipality: string, access_token: string, layer_name?: string) {
  
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
      'Authorization': `Bearer ${access_token}`
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

export async function askQuestion(lat: number, lon: number, municipality: string, question: string, properties: LocationProperties, access_token: string): Promise<QuestionResponse> {
  const coords: Coordinates = {
    lat,
    lon,
    margin: DEFAULT_MARGIN,
    municipality
  };

  const q: QuestionRequest = {
   question,
   properties,
   coords
  };

  try {
    const response = await fetch(`${BACKEND_URL}/ask_question/`, {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
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

export async function getResponses(access_token: string): Promise<QuestionResponse[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/responses/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: QuestionResponse[] = await response.json();
    return data;

  } catch (error) {
    console.error("Error in getResponses:", error);
    throw error; // Re-throw the error to be handled by the client
  }
}

export async function getResponseCount(access_token: string): Promise<{ questions_asked: number; limit: number, last_reset: string }> { 
  try {
    const response = await fetch(`${BACKEND_URL}/request_count/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return data;

  } catch (error) {
    console.error("Error in getRequestCount:", error);
    throw error; // Re-throw the error to be handled by the client
  }
}

export async function getGeocodingInfo(address: string) {
  try {
    console.log(MAPS_API_KEY)
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(MAPS_API_KEY)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Request URL:', response.url);

    console.log(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return data;

  } catch (error) {
    console.error("Error in getGeocodingInfo:", error);
    throw error; // Re-throw the error to be handled by the client
  }
}