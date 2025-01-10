import fs from 'fs';
import path from 'path';
import { NextResponse, NextRequest } from 'next/server';

export function GET(req: NextRequest) {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    
    return NextResponse.json({ BACKEND_URL });
  } catch (error) {
    console.error('Error reading config info:', error);
    return NextResponse.error();
  }
}