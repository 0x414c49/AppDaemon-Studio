import { http, HttpResponse } from 'msw';
import type { AppInfo, VersionInfo } from '@/types';

// In-memory storage for mock data
const mockApps: Map<string, AppInfo> = new Map();
const mockFiles: Map<string, { content: string; last_modified: string }> = new Map();
const mockVersions: Map<string, VersionInfo[]> = new Map();
const mockYamlConfigs: Map<string, Record<string, unknown>> = new Map();

// Initialize with sample data
function initializeMockData(): void {
  mockApps.clear();
  mockFiles.clear();
  mockVersions.clear();
  mockYamlConfigs.clear();
  
  // Add sample app
  const sampleApp: AppInfo = {
    name: 'sample_app',
    class_name: 'SampleApp',
    description: 'A sample app for testing',
    has_python: true,
    has_yaml: true,
    last_modified: new Date().toISOString(),
    version_count: 1,
  };
  mockApps.set('sample_app', sampleApp);
  
  mockFiles.set('sample_app', {
    content: `import appdaemon.plugins.hass.hassapi as hass

class SampleApp(hass.Hass):
    def initialize(self):
        self.log("Sample app initialized")
`,
    last_modified: new Date().toISOString(),
  });
  
  mockVersions.set('sample_app', [
    {
      version: '20240228_120000',
      timestamp: new Date().toISOString(),
      size: 150,
      filename: 'sample_app.py',
    },
  ]);
  
  mockYamlConfigs.set('sample_app', {
    sample_app: {
      module: 'sample_app',
      class: 'SampleApp',
    },
  });
}

// Initialize on load
initializeMockData();

interface CreateAppBody {
  name: string;
  class_name: string;
  description?: string;
}

interface UpdateFileBody {
  content: string;
}

interface UpdateYamlBody {
  config: Record<string, unknown>;
}

export const handlers = [
  // List all apps
  http.get('/api/apps', () => {
    const apps = Array.from(mockApps.values());
    return HttpResponse.json({ apps, count: apps.length });
  }),

  // Create app
  http.post('/api/apps', async ({ request }) => {
    const body = (await request.json()) as CreateAppBody;
    const { name, class_name, description } = body;
    
    if (mockApps.has(name)) {
      return HttpResponse.json(
        { detail: `App '${name}' already exists` },
        { status: 409 }
      );
    }
    
    const newApp: AppInfo = {
      name,
      class_name,
      description: description || '',
      has_python: true,
      has_yaml: true,
      last_modified: new Date().toISOString(),
      version_count: 0,
    };
    mockApps.set(name, newApp);
    
    mockFiles.set(name, {
      content: `import appdaemon.plugins.hass.hassapi as hass

class ${class_name}(hass.Hass):
    def initialize(self):
        self.log("${class_name} initialized")
`,
      last_modified: new Date().toISOString(),
    });
    
    return HttpResponse.json(newApp, { status: 201 });
  }),

  // Get specific app
  http.get('/api/apps/:name', ({ params }) => {
    const app = mockApps.get(params.name as string);
    if (app) {
      return HttpResponse.json(app);
    }
    return HttpResponse.json(
      { detail: `App '${params.name}' not found` },
      { status: 404 }
    );
  }),

  // Delete app
  http.delete('/api/apps/:name', ({ params }) => {
    const name = params.name as string;
    if (mockApps.has(name)) {
      mockApps.delete(name);
      mockFiles.delete(name);
      mockVersions.delete(name);
      mockYamlConfigs.delete(name);
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json(
      { detail: `App '${name}' not found` },
      { status: 404 }
    );
  }),

  // Get Python file
  http.get('/api/files/:app/python', ({ params }) => {
    const appName = params.app as string;
    const file = mockFiles.get(appName);
    if (file) {
      return HttpResponse.json({
        content: file.content,
        last_modified: file.last_modified,
      });
    }
    return HttpResponse.json(
      { detail: `App '${appName}' not found` },
      { status: 404 }
    );
  }),

  // Update Python file
  http.put('/api/files/:app/python', async ({ params, request }) => {
    const appName = params.app as string;
    const body = (await request.json()) as UpdateFileBody;
    const { content } = body;
    
    // Save version before updating
    const existingFile = mockFiles.get(appName);
    if (existingFile) {
      const versions = mockVersions.get(appName) || [];
      versions.unshift({
        version: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
        timestamp: new Date().toISOString(),
        size: existingFile.content.length,
        filename: `${appName}.py`,
      });
      mockVersions.set(appName, versions);
      
      const app = mockApps.get(appName);
      if (app) {
        app.version_count = versions.length;
        app.last_modified = new Date().toISOString();
      }
    }
    
    mockFiles.set(appName, {
      content,
      last_modified: new Date().toISOString(),
    });
    
    return HttpResponse.json({
      status: 'success',
      message: `Python file for '${appName}' updated`,
    });
  }),

  // Get YAML config
  http.get('/api/files/:app/yaml', ({ params }) => {
    const appName = params.app as string;
    const config = mockYamlConfigs.get(appName);
    return HttpResponse.json(config || {});
  }),

  // Update YAML config
  http.put('/api/files/:app/yaml', async ({ params, request }) => {
    const appName = params.app as string;
    const body = (await request.json()) as UpdateYamlBody;
    if (body.config) {
      mockYamlConfigs.set(appName, body.config);
    }
    
    return HttpResponse.json({
      status: 'success',
      message: `YAML config for '${appName}' updated`,
    });
  }),

  // List versions
  http.get('/api/versions/:app', ({ params }) => {
    const appName = params.app as string;
    const versions = mockVersions.get(appName) || [];
    return HttpResponse.json({ versions, count: versions.length });
  }),

  // Get version content
  http.get('/api/versions/:app/:version', ({ params }) => {
    const appName = params.app as string;
    const file = mockFiles.get(appName);
    if (file) {
      return HttpResponse.json({
        content: file.content,
        version: params.version,
        filename: `${appName}.py`,
      });
    }
    return HttpResponse.json(
      { detail: `Version '${params.version}' not found` },
      { status: 404 }
    );
  }),

  // Restore version
  http.post('/api/versions/:app/:version/restore', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      message: `Version '${params.version}' of app '${params.app}' restored successfully`,
      version: params.version,
    });
  }),

  // Delete version
  http.delete('/api/versions/:app/:version', ({ params }) => {
    const appName = params.app as string;
    const versionId = params.version as string;
    const versions = mockVersions.get(appName) || [];
    const updatedVersions = versions.filter((v: VersionInfo) => v.version !== versionId);
    mockVersions.set(appName, updatedVersions);
    
    const app = mockApps.get(appName);
    if (app) {
      app.version_count = updatedVersions.length;
    }
    
    return new HttpResponse(null, { status: 204 });
  }),

  // Get logs
  http.get('/api/logs', () => {
    return HttpResponse.json({
      lines: [
        '2024-02-28 12:00:00 INFO AppDaemon Started',
        '2024-02-28 12:00:01 INFO Loading apps',
        '2024-02-28 12:00:02 INFO sample_app initialized',
      ],
      count: 3,
    });
  }),

  // WebSocket endpoint (return empty for now)
  http.get('/api/ws/logs', () => {
    return HttpResponse.json({ status: 'WebSocket not supported in mock mode' });
  }),
];

// Export function to reset mock data
export function resetMockData(): void {
  initializeMockData();
}
