import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const apiKey = process.env.MAPS_API_KEY;

  if (!address || !apiKey) {
    return NextResponse.json({ error: 'Missing address or API key' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(apiKey)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching geocoding info:', error);
    return NextResponse.json({ error: 'Failed to fetch geocoding information' }, { status: 500 });
  }
}