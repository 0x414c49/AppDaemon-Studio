import { NextRequest, NextResponse } from 'next/server';
import { listVersions, getVersion, restoreVersion, deleteVersion } from '@/lib/version-control';

// GET /api/versions/[app] - List all versions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ app: string }> }
) {
  try {
    const { app } = await params;
    
    console.log('[Versions API] Listing versions for app:', app);
    
    if (!app) {
      console.log('[Versions API] Error: App name is required');
      return NextResponse.json(
        { detail: 'App name is required' },
        { status: 400 }
      );
    }
    
    const versions = await listVersions(app);
    console.log('[Versions API] Found', versions.length, 'versions for', app);
    
    return NextResponse.json({ versions, count: versions.length });
  } catch (error) {
    console.error('[Versions API] Error listing versions:', error);
    const message = error instanceof Error ? error.message : 'Failed to list versions';
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    );
  }
}

// PUT /api/versions/[app] - Restore a version
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ app: string }> }
) {
  try {
    const { app } = await params;
    const body = await request.json();
    const { versionId } = body;
    
    if (!versionId) {
      return NextResponse.json(
        { detail: 'Missing versionId' },
        { status: 400 }
      );
    }
    
    await restoreVersion(app, versionId);
    return NextResponse.json({ success: true, message: 'Version restored' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restore version';
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    );
  }
}

// DELETE /api/versions/[app] - Delete a version
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ app: string }> }
) {
  try {
    const { app } = await params;
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');
    
    if (!versionId) {
      return NextResponse.json(
        { detail: 'Missing versionId' },
        { status: 400 }
      );
    }
    
    await deleteVersion(app, versionId);
    return NextResponse.json({ success: true, message: 'Version deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete version';
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    );
  }
}
