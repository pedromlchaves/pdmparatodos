import { QuestionResponse } from "@/types" // Ensure this is the correct import
import { getSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import jwt from 'jsonwebtoken';

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
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

async function fetchWithAuth(url: string, options: RequestInit): Promise<Response> {
  const session = await getSession(); // Retrieve the session, including access_token
  
  if (!session?.user?.access_token) {
    // No token available, redirect to login
    signIn(); // Re-authenticate
    return Promise.reject(new Error("No access token available"));
  }
  
  // Check if the token is expired
  const token = session.user.access_token;
  try {
    const decoded: any = jwt.decode(token); // Decode without verification to get the expiration
    if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
      signIn(); // Re-authenticate
      return Promise.reject(new Error("Token expired"));
    }
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    signIn(); // Re-authenticate
    return Promise.reject(new Error("Invalid token"));
  }

  // Add the access token to the headers
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.user.access_token}`,
    },
  };

  try {
    const response = await fetch(url, authOptions);
    
    if (response.status === 401) {
      // Unauthorized, redirect to login
      signIn(); // Re-authenticate
      return Promise.reject(new Error("Unauthorized"));
    }

    return response;
  } catch (error) {
    console.error("Error in fetchWithAuth:", error);
    throw error;
  }
}

export async function getLocationInfo(lat: number, lon: number, municipality: string, layer_name?: string) {
  const coords: Coordinates = {
    lat,
    lon,
    margin: DEFAULT_MARGIN,
    municipality,
  };

  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/get_properties/`, {
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


export async function askQuestion(lat: number, lon: number, municipality: string, question: string, properties: LocationProperties): Promise<QuestionResponse> {
  const coords: Coordinates = {
    lat,
    lon,
    margin: DEFAULT_MARGIN,
    municipality,
  };

  const q: QuestionRequest = {
    question,
    properties,
    coords,
  };

  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/ask_question/`, {
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
    throw error;
  }
}

export async function getResponses(): Promise<QuestionResponse[]> {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/responses/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: QuestionResponse[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getResponses:", error);
    throw error;
  }
}


export async function getResponseCount(): Promise<{ questions_asked: number; limit: number; last_reset: string }> {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/request_count/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getResponseCount:", error);
    throw error;
  }
}

export async function getGeocodingInfo(address: string) {
  const response = await fetchWithAuth(`/api/geocoding?address=${encodeURIComponent(address)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}