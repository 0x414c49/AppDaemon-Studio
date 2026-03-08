import { NextRequest, NextResponse } from 'next/server';
import { getVersion } from '@/lib/version-control';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ app: string; timestamp: string }> }
) {
  try {
    const { app, timestamp } = await params;
    
    if (!app || !timestamp) {
      return NextResponse.json(
        { detail: 'App name and timestamp are required' },
        { status: 400 }
      );
    }
    
    const version = await getVersion(app, timestamp);
    return NextResponse.json(version);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Version not found';
    return NextResponse.json(
      { detail: message },
      { status: 404 }
    );
  }
}
