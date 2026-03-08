import { NextRequest, NextResponse } from 'next/server';
import { 
  readPythonFile, 
  writePythonFile,
  readAppsYaml,
  deleteApp 
} from '../../../../lib/file-manager';
import { createVersion } from '../../../../lib/version-control';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const [app, type = 'python'] = pathArray;
    
    if (!app) {
      return NextResponse.json(
        { detail: 'App name is required' },
        { status: 400 }
      );
    }
    
    let fileContent;
    if (type === 'yaml' || type === 'yml') {
      fileContent = await readAppsYaml();
    } else {
      fileContent = await readPythonFile(app);
    }
    
    return NextResponse.json(fileContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'File not found';
    return NextResponse.json(
      { detail: message },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const [app, type = 'python'] = pathArray;
    
    if (!app) {
      return NextResponse.json(
        { detail: 'App name is required' },
        { status: 400 }
      );
    }
    
    const { content } = await request.json();
    
    if (type === 'yaml' || type === 'yml') {
      return NextResponse.json(
        { detail: 'YAML config is read-only. Use app settings to update.' },
        { status: 400 }
      );
    }
    
    try {
      const existing = await readPythonFile(app);
      await createVersion(app, existing.content);
    } catch {}
    
    await writePythonFile(app, content);
    
    return NextResponse.json({
      status: 'success',
      message: `Python file for '${app}' updated`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save file';
    return NextResponse.json(
      { detail: message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const [app] = pathArray;
    
    if (!app) {
      return NextResponse.json(
        { detail: 'App name is required' },
        { status: 400 }
      );
    }
    
    await deleteApp(app);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete app';
    return NextResponse.json(
      { detail: message },
      { status: 404 }
    );
  }
}
