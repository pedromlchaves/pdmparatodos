import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { NextResponse, NextRequest } from 'next/server';

export function GET(req: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'public/article_pages.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.error();
  }
}