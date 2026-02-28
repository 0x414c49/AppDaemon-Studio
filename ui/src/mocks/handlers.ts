import { http, HttpResponse } from 'msw';

// In-memory storage for mock data
const mockApps = new Map();
const mockFiles = new Map();
const mockVersions = new Map();
const mockYamlConfigs = new Map();

// Initialize with sample data
function initializeMockData() {
  mockApps.clear();
  mockFiles.clear();
  mockVersions.clear();
  mockYamlConfigs.clear();
  
  // Add sample app
  mockApps.set('sample_app', {
    name: 'sample_app',
    class_name: 'SampleApp',
    description: 'A sample app for testing',
    has_python: true,
    has_yaml: true,
    last_modified: new Date().toISOString(),
    version_count: 1,
  });
  
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

export const handlers = [
  // List all apps
  http.get('/api/apps', () => {
    const apps = Array.from(mockApps.values());
    return HttpResponse.json({ apps, count: apps.length });
  }),

  // Create app
  http.post('/api/apps', async ({ request }) => {
    const body = await request.json();
    const { name, class_name, description } = body;
    
    if (mockApps.has(name)) {
      return HttpResponse.json(
        { detail: `App '${name}' already exists` },
        { status: 409 }
      );
    }
    
    const newApp = {
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
    const app = mockApps.get(params.name);
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
    if (mockApps.has(params.name)) {
      mockApps.delete(params.name);
      mockFiles.delete(params.name);
      mockVersions.delete(params.name);
      mockYamlConfigs.delete(params.name);
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json(
      { detail: `App '${params.name}' not found` },
      { status: 404 }
    );
  }),

  // Get Python file
  http.get('/api/files/:app/python', ({ params }) => {
    const file = mockFiles.get(params.app);
    if (file) {
      return HttpResponse.json({
        content: file.content,
        last_modified: file.last_modified,
      });
    }
    return HttpResponse.json(
      { detail: `App '${params.app}' not found` },
      { status: 404 }
    );
  }),

  // Update Python file
  http.put('/api/files/:app/python', async ({ params, request }) => {
    const body = await request.json();
    const { content } = body;
    
    // Save version before updating
    const existingFile = mockFiles.get(params.app);
    if (existingFile) {
      const versions = mockVersions.get(params.app) || [];
      versions.unshift({
        version: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
        timestamp: new Date().toISOString(),
        size: existingFile.content.length,
        filename: `${params.app}.py`,
      });
      mockVersions.set(params.app, versions);
      
      const app = mockApps.get(params.app);
      if (app) {
        app.version_count = versions.length;
        app.last_modified = new Date().toISOString();
      }
    }
    
    mockFiles.set(params.app, {
      content,
      last_modified: new Date().toISOString(),
    });
    
    return HttpResponse.json({
      status: 'success',
      message: `Python file for '${params.app}' updated`,
    });
  }),

  // Get YAML config
  http.get('/api/files/:app/yaml', ({ params }) => {
    const config = mockYamlConfigs.get(params.app);
    return HttpResponse.json(config || {});
  }),

  // Update YAML config
  http.put('/api/files/:app/yaml', async ({ params, request }) => {
    const body = await request.json();
    mockYamlConfigs.set(params.app, body.config);
    return HttpResponse.json({
      status: 'success',
      message: `YAML config for '${params.app}' updated`,
    });
  }),

  // List versions
  http.get('/api/versions/:app', ({ params }) => {
    const versions = mockVersions.get(params.app) || [];
    return HttpResponse.json({ versions, count: versions.length });
  }),

  // Get version content
  http.get('/api/versions/:app/:version', ({ params }) => {
    const file = mockFiles.get(params.app);
    if (file) {
      return HttpResponse.json({
        content: file.content,
        version: params.version,
        filename: `${params.app}.py`,
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
    const versions = mockVersions.get(params.app) || [];
    const updatedVersions = versions.filter((v) => v.version !== params.version);
    mockVersions.set(params.app, updatedVersions);
    
    const app = mockApps.get(params.app);
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
export function resetMockData() {
  initializeMockData();
}
