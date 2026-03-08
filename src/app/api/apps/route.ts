import { NextRequest, NextResponse } from 'next/server';
import { listApps, createApp, deleteApp } from '../../../lib/file-manager';

export async function GET() {
  try {
    const apps = await listApps();
    return NextResponse.json({ apps, count: apps.length });
  } catch (error) {
    console.error('Error listing apps:', error);
    return NextResponse.json(
      { detail: 'Failed to list apps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const app = await createApp(data);
    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    console.error('Error creating app:', error);
    const message = error instanceof Error ? error.message : 'Failed to create app';
    return NextResponse.json(
      { detail: message },
      { status: 400 }
    );
  }
}
