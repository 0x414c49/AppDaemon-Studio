import { Page } from '@playwright/test';

/**
 * Mock API responses for E2E tests
 * This allows tests to run without a real backend server
 */

export interface MockApp {
  name: string;
  class_name: string;
  description: string;
  has_python: boolean;
  has_yaml: boolean;
  last_modified: string;
  version_count: number;
}

export interface MockVersion {
  version: string;
  timestamp: string;
  size: number;
  filename: string;
}

// In-memory storage for mock data
const mockApps: Map<string, MockApp> = new Map();
const mockFiles: Map<string, { content: string; last_modified: string }> = new Map();
const mockVersions: Map<string, MockVersion[]> = new Map();
const mockYamlConfigs: Map<string, Record<string, unknown>> = new Map();

// Initial mock data
export function setupInitialMockData(): void {
  // Clear existing data
  mockApps.clear();
  mockFiles.clear();
  mockVersions.clear();
  mockYamlConfigs.clear();
  
  // Add a sample app
  const sampleApp: MockApp = {
    name: 'sample_app',
    class_name: 'SampleApp',
    description: 'A sample app for testing',
    has_python: true,
    has_yaml: true,
    last_modified: new Date().toISOString(),
    version_count: 1,
  };
  mockApps.set('sample_app', sampleApp);
  
  // Add sample file content
  mockFiles.set('sample_app', {
    content: `import appdaemon.plugins.hass.hassapi as hass

class SampleApp(hass.Hass):
    def initialize(self):
        self.log("Sample app initialized")
`,
    last_modified: new Date().toISOString(),
  });
  
  // Add sample version
  mockVersions.set('sample_app', [
    {
      version: '20240228_120000',
      timestamp: new Date().toISOString(),
      size: 150,
      filename: 'sample_app.py',
    },
  ]);
  
  // Add sample YAML config
  mockYamlConfigs.set('sample_app', {
    sample_app: {
      module: 'sample_app',
      class: 'SampleApp',
    },
  });
}

/**
 * Setup API mocking for a page
 */
export async function setupMockAPIs(page: Page): Promise<void> {
  // Reset mock data
  setupInitialMockData();
  
  // Mock GET /api/apps - List all apps
  await page.route('**/api/apps', async (route) => {
    const method = route.request().method();
    
    if (method === 'GET') {
      const apps = Array.from(mockApps.values());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ apps, count: apps.length }),
      });
    } else if (method === 'POST') {
      // Create app
      const postData = JSON.parse(route.request().postData() || '{}');
      const { name, class_name, description } = postData;
      
      if (mockApps.has(name)) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ detail: `App '${name}' already exists` }),
        });
        return;
      }
      
      const newApp: MockApp = {
        name,
        class_name,
        description: description || '',
        has_python: true,
        has_yaml: true,
        last_modified: new Date().toISOString(),
        version_count: 0,
      };
      mockApps.set(name, newApp);
      
      // Create initial file content
      mockFiles.set(name, {
        content: `import appdaemon.plugins.hass.hassapi as hass

class ${class_name}(hass.Hass):
    def initialize(self):
        self.log("${class_name} initialized")
`,
        last_modified: new Date().toISOString(),
      });
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newApp),
      });
    }
  });
  
  // Mock GET /api/apps/{name} - Get specific app
  await page.route('**/api/apps/*', async (route) => {
    const url = route.request().url();
    const name = url.split('/').pop();
    const method = route.request().method();
    
    if (!name) {
      await route.continue();
      return;
    }
    
    if (method === 'GET') {
      const app = mockApps.get(name);
      if (app) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(app),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: `App '${name}' not found` }),
        });
      }
    } else if (method === 'DELETE') {
      if (mockApps.has(name)) {
        mockApps.delete(name);
        mockFiles.delete(name);
        mockVersions.delete(name);
        mockYamlConfigs.delete(name);
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: `App '${name}' not found` }),
        });
      }
    }
  });
  
  // Mock /api/files/{app}/python - Python file operations
  await page.route('**/api/*/python', async (route) => {
    const url = route.request().url();
    const parts = url.split('/');
    const appIndex = parts.indexOf('api') + 2;
    const appName = parts[appIndex];
    const method = route.request().method();
    
    if (method === 'GET') {
      const file = mockFiles.get(appName);
      if (file) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: file.content,
            last_modified: file.last_modified,
          }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: `App '${appName}' not found` }),
        });
      }
    } else if (method === 'PUT') {
      const postData = JSON.parse(route.request().postData() || '{}');
      const { content } = postData;
      
      // Save new version before updating
      const existingFile = mockFiles.get(appName);
      if (existingFile) {
        const versions = mockVersions.get(appName) || [];
        const newVersion: MockVersion = {
          version: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
          timestamp: new Date().toISOString(),
          size: existingFile.content.length,
          filename: `${appName}.py`,
        };
        versions.unshift(newVersion);
        mockVersions.set(appName, versions);
        
        // Update version count
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
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: `Python file for '${appName}' updated`,
        }),
      });
    }
  });
  
  // Mock /api/files/{app}/yaml - YAML config operations
  await page.route('**/api/*/yaml', async (route) => {
    const url = route.request().url();
    const parts = url.split('/');
    const appIndex = parts.indexOf('api') + 2;
    const appName = parts[appIndex];
    const method = route.request().method();
    
    if (method === 'GET') {
      const config = mockYamlConfigs.get(appName);
      if (config) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(config),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }
    } else if (method === 'PUT') {
      const postData = JSON.parse(route.request().postData() || '{}');
      mockYamlConfigs.set(appName, postData.config);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: `YAML config for '${appName}' updated`,
        }),
      });
    }
  });
  
  // Mock /api/versions/{app} - List versions
  await page.route('**/api/versions/*', async (route) => {
    const url = route.request().url();
    const parts = url.split('/');
    const appName = parts[parts.length - 1];
    const method = route.request().method();
    
    if (method === 'GET') {
      const versions = mockVersions.get(appName) || [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ versions, count: versions.length }),
      });
    }
  });
  
  // Mock /api/versions/{app}/{version} - Get/restore specific version
  await page.route('**/api/versions/*/*', async (route) => {
    const url = route.request().url();
    const parts = url.split('/');
    const appName = parts[parts.length - 2];
    const versionId = parts[parts.length - 1];
    const method = route.request().method();
    
    if (method === 'GET') {
      // Return current file content as version content for simplicity
      const file = mockFiles.get(appName);
      if (file) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: file.content,
            version: versionId,
            filename: `${appName}.py`,
          }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: `Version '${versionId}' not found` }),
        });
      }
    } else if (method === 'POST') {
      // Restore version - just return success
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: `Version '${versionId}' of app '${appName}' restored successfully`,
          version: versionId,
        }),
      });
    } else if (method === 'DELETE') {
      const versions = mockVersions.get(appName) || [];
      const updatedVersions = versions.filter((v) => v.version !== versionId);
      mockVersions.set(appName, updatedVersions);
      
      // Update version count
      const app = mockApps.get(appName);
      if (app) {
        app.version_count = updatedVersions.length;
      }
      
      await route.fulfill({ status: 204 });
    }
  });
  
  // Mock /api/logs - Get recent logs
  await page.route('**/api/logs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lines: [
          '2024-02-28 12:00:00 INFO AppDaemon Started',
          '2024-02-28 12:00:01 INFO Loading apps',
          '2024-02-28 12:00:02 INFO sample_app initialized',
        ],
        count: 3,
      }),
    });
  });
  
  // Mock WebSocket connection for logs
  await page.route('**/api/ws/logs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'WebSocket mock not supported in HTTP mode' }),
    });
  });
}

/**
 * Clear all mock data
 */
export function clearMockData(): void {
  mockApps.clear();
  mockFiles.clear();
  mockVersions.clear();
  mockYamlConfigs.clear();
}

/**
 * Get current mock apps for assertions
 */
export function getMockApps(): MockApp[] {
  return Array.from(mockApps.values());
}

/**
 * Get mock file content for assertions
 */
export function getMockFile(appName: string): { content: string; last_modified: string } | undefined {
  return mockFiles.get(appName);
}
