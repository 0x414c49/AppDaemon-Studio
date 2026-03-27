import { promises as fs } from 'fs';
import path from 'path';
import { AppInfo, CreateAppData, FileContent, AppsConfig, AppConfig } from '@/types';
import { generatePythonTemplate } from './templates';

function getConfigDir() {
  return process.env.APPS_DIR || '/config';
}

const APPS_DIR = path.join(getConfigDir(), 'apps');
const APPS_CONFIG = path.join(APPS_DIR, 'apps.yaml');
const VERSIONS_DIR = path.join(APPS_DIR, '.versions');

export class AppNotFoundError extends Error {
  constructor(appName: string) {
    super(`App '${appName}' not found`);
    this.name = 'AppNotFoundError';
  }
}

export class InvalidAppNameError extends Error {
  constructor(name: string) {
    super(`Invalid app name: '${name}'. Use only alphanumeric characters and underscores.`);
    this.name = 'InvalidAppNameError';
  }
}

export class FileManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileManagerError';
  }
}

export function toSnakeCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-]+/g, '_')
    .toLowerCase();
}

function validateAppName(name: string): void {
  if (!name || !/^[a-z_][a-z0-9_]*$/.test(name)) {
    throw new InvalidAppNameError(name);
  }
}

async function extractClassNameFromFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const match = content.match(/class\s+(\w+)\s*\(/);
    return match ? match[1] : 'App';
  } catch {
    return 'App';
  }
}

async function ensureAppsDir(): Promise<void> {
  try {
    await fs.access(APPS_DIR);
  } catch {
    await fs.mkdir(APPS_DIR, { recursive: true });
  }
}

async function ensureVersionsDir(): Promise<void> {
  try {
    await fs.access(VERSIONS_DIR);
  } catch {
    await fs.mkdir(VERSIONS_DIR, { recursive: true });
  }
}

async function readAppsConfig(): Promise<AppsConfig> {
  try {
    const content = await fs.readFile(APPS_CONFIG, 'utf-8');
    return parseYamlConfig(content);
  } catch {
    return {};
  }
}

async function writeAppsConfig(config: AppsConfig): Promise<void> {
  await ensureAppsDir();
  const content = stringifyYamlConfig(config);
  await fs.writeFile(APPS_CONFIG, content);
}

function parseYamlConfig(content: string): AppsConfig {
  const config: AppsConfig = {};
  const lines = content.split('\n');
  let currentApp = '';
  let currentConfig: AppConfig | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (!line.startsWith(' ') && trimmed.endsWith(':')) {
      if (currentApp && currentConfig) {
        config[currentApp] = currentConfig;
      }
      currentApp = trimmed.slice(0, -1);
      currentConfig = { module: currentApp, class: currentApp };
    } else if (currentApp && currentConfig && line.startsWith('  ')) {
      const [key, ...valueParts] = trimmed.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        (currentConfig as any)[key.trim()] = value;
      }
    }
  }

  if (currentApp && currentConfig) {
    config[currentApp] = currentConfig;
  }

  return config;
}

function stringifyYamlConfig(config: AppsConfig): string {
  let result = '# AppDaemon Apps Configuration\n';
  result += `# Generated: ${new Date().toISOString()}\n\n`;

  for (const [appName, appConfig] of Object.entries(config)) {
    result += `${appName}:\n`;
    result += `  module: ${appConfig.module}\n`;
    result += `  class: ${appConfig.class}\n`;
    
    if (appConfig.description) {
      result += `  description: ${appConfig.description}\n`;
    }
    if (appConfig.icon) {
      result += `  icon: ${appConfig.icon}\n`;
    }
    
    for (const [key, value] of Object.entries(appConfig)) {
      if (!['module', 'class', 'description', 'icon'].includes(key)) {
        result += `  ${key}: ${value}\n`;
      }
    }
    result += '\n';
  }

  return result;
}

export async function listApps(): Promise<AppInfo[]> {
  await ensureAppsDir();
  
  const config = await readAppsConfig();
  const apps: AppInfo[] = [];
  
  const files = await fs.readdir(APPS_DIR);
  const pythonFiles = files.filter(f => f.endsWith('.py') && !f.startsWith('.'));
  
  for (const pyFile of pythonFiles) {
    const appName = pyFile.replace('.py', '');
    const pyPath = path.join(APPS_DIR, pyFile);
    
    let appConfig = config[appName];
    
    if (!appConfig) {
      const className = await extractClassNameFromFile(pyPath);
      appConfig = {
        module: appName,
        class: className,
        icon: 'mdi:application',
        description: '',
      };
    }
    
    const stats = await fs.stat(pyPath);
    
    let versionCount = 0;
    try {
      await ensureVersionsDir();
      const versions = await fs.readdir(VERSIONS_DIR);
      versionCount = versions.filter(v => v.startsWith(`${appName}_`) && v.endsWith('.py')).length;
    } catch {}
    
    apps.push({
      name: appName,
      module: appConfig.module || appName,
      class_name: appConfig.class,
      description: appConfig.description || '',
      icon: appConfig.icon,
      has_python: true,
      has_yaml: true,
      last_modified: stats.mtime.toISOString(),
      version_count: versionCount,
    });
  }
  
  for (const [appName, appConfig] of Object.entries(config)) {
    if (!apps.find(a => a.name === appName)) {
      apps.push({
        name: appName,
        module: appConfig.module || appName,
        class_name: appConfig.class,
        description: appConfig.description || '',
        icon: appConfig.icon,
        has_python: false,
        has_yaml: true,
        last_modified: new Date().toISOString(),
        version_count: 0,
      });
    }
  }
  
  return apps.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createApp(data: CreateAppData): Promise<AppInfo> {
  validateAppName(data.name);
  
  const pyPath = path.join(APPS_DIR, `${data.name}.py`);
  
  try {
    await fs.access(pyPath);
    throw new FileManagerError(`App '${data.name}' already exists`);
  } catch (error) {
    if (error instanceof FileManagerError) throw error;
  }
  
  const config = await readAppsConfig();
  
  config[data.name] = {
    module: data.name,
    class: data.class_name,
    description: data.description || '',
    icon: data.icon || 'mdi:application',
  };
  
  await writeAppsConfig(config);
  
  const pythonContent = generatePythonTemplate(data.name, data.class_name, data.description);
  await fs.writeFile(pyPath, pythonContent);
  
  await ensureVersionsDir();
  
  return {
    name: data.name,
    module: data.name,
    class_name: data.class_name,
    description: data.description || '',
    icon: data.icon,
    has_python: true,
    has_yaml: true,
    last_modified: new Date().toISOString(),
    version_count: 0,
  };
}

export async function deleteApp(name: string): Promise<void> {
  validateAppName(name);
  
  const pyPath = path.join(APPS_DIR, `${name}.py`);
  
  const config = await readAppsConfig();
  
  if (!config[name]) {
    try {
      await fs.access(pyPath);
    } catch {
      throw new AppNotFoundError(name);
    }
  }
  
  delete config[name];
  await writeAppsConfig(config);
  
  try {
    await fs.unlink(pyPath);
  } catch {}
}

export async function readPythonFile(appName: string): Promise<FileContent> {
  validateAppName(appName);
  
  const filePath = path.join(APPS_DIR, `${appName}.py`);
  
  try {
    const [content, stats] = await Promise.all([
      fs.readFile(filePath, 'utf-8'),
      fs.stat(filePath)
    ]);
    
    return {
      content,
      last_modified: stats.mtime.toISOString()
    };
  } catch {
    throw new AppNotFoundError(appName);
  }
}

export async function writePythonFile(appName: string, content: string): Promise<void> {
  validateAppName(appName);
  
  const filePath = path.join(APPS_DIR, `${appName}.py`);
  
  try {
    await fs.access(APPS_DIR);
  } catch {
    throw new AppNotFoundError(appName);
  }
  
  await fs.writeFile(filePath, content);
}

export async function readAppsYaml(): Promise<FileContent> {
  try {
    const [content, stats] = await Promise.all([
      fs.readFile(APPS_CONFIG, 'utf-8'),
      fs.stat(APPS_CONFIG)
    ]);
    
    return {
      content,
      last_modified: stats.mtime.toISOString()
    };
  } catch {
    return {
      content: '# AppDaemon Apps Configuration\n',
      last_modified: new Date().toISOString()
    };
  }
}

export async function writeAppsYaml(content: string): Promise<void> {
  await ensureAppsDir();
  await fs.writeFile(APPS_CONFIG, content);
}

export async function updateAppConfig(appName: string, updates: Partial<AppConfig>): Promise<void> {
  validateAppName(appName);
  
  const config = await readAppsConfig();
  
  if (!config[appName]) {
    throw new AppNotFoundError(appName);
  }
  
  config[appName] = { ...config[appName], ...updates };
  await writeAppsConfig(config);
}
