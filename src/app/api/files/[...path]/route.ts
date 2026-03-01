import { NextRequest, NextResponse } from 'next/server';
import { 
  readPythonFile, 
  writePythonFile, 
  readYamlFile, 
  writeYamlFile,
  deleteApp 
} from '@/lib/file-manager';
import { createVersion } from '@/lib/version-control';

// GET /api/files/[app]/[type] - type can be 'python' or 'yaml'
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const [app, type = 'python'] = params.path;
    
    if (!app) {
      return NextResponse.json(
        { detail: 'App name is required' },
        { status: 400 }
      );
    }
    
    let fileContent;
    if (type === 'yaml' || type === 'yml') {
      fileContent = await readYamlFile(app);
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

// PUT /api/files/[app]/[type] - type can be 'python' or 'yaml'
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const [app, type = 'python'] = params.path;
    
    if (!app) {
      return NextResponse.json(
        { detail: 'App name is required' },
        { status: 400 }
      );
    }
    
    const { content } = await request.json();
    
    // Create backup before saving
    try {
      if (type === 'yaml' || type === 'yml') {
        const existing = await readYamlFile(app);
        await createVersion(app, `${app}.yaml`, existing.content);
        await writeYamlFile(app, content);
      } else {
        const existing = await readPythonFile(app);
        await createVersion(app, `${app}.py`, existing.content);
        await writePythonFile(app, content);
      }
    } catch {
      // No existing file, just write new content
      if (type === 'yaml' || type === 'yml') {
        await writeYamlFile(app, content);
      } else {
        await writePythonFile(app, content);
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: `${type === 'yaml' || type === 'yml' ? 'YAML' : 'Python'} file for '${app}' updated`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save file';
    return NextResponse.json(
      { detail: message },
      { status: 400 }
    );
  }
}

// DELETE /api/files/[app] - Delete the entire app
export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const [app] = params.path;
    
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
