import { promises as fs } from 'fs';
import path from 'path';
import { AppInfo, CreateAppData, FileContent } from '../types';
import { generatePythonTemplate, generateYamlTemplate } from './templates';

const APPS_DIR = '/config/apps';

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

function validateAppName(name: string): void {
  if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new InvalidAppNameError(name);
  }
}

export async function listApps(): Promise<AppInfo[]> {
  const apps: AppInfo[] = [];
  
  try {
    await fs.access(APPS_DIR);
  } catch {
    await fs.mkdir(APPS_DIR, { recursive: true });
    return apps;
  }
  
  const entries = await fs.readdir(APPS_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const appPath = path.join(APPS_DIR, entry.name);
      const pythonPath = path.join(appPath, `${entry.name}.py`);
      const yamlPath = path.join(appPath, `${entry.name}.yaml`);
      
      const [hasPython, hasYaml, stats] = await Promise.all([
        fs.access(pythonPath).then(() => true).catch(() => false),
        fs.access(yamlPath).then(() => true).catch(() => false),
        fs.stat(appPath)
      ]);
      
      // Get class name from Python file if exists
      let className = entry.name;
      if (hasPython) {
        try {
          const content = await fs.readFile(pythonPath, 'utf-8');
          const match = content.match(/class\s+(\w+)\s*\(/);
          if (match) {
            className = match[1];
          }
        } catch {
          // Use directory name
        }
      }
      
      apps.push({
        name: entry.name,
        class_name: className,
        description: '', // Could read from YAML or Python docstring
        has_python: hasPython,
        has_yaml: hasYaml,
        last_modified: stats.mtime.toISOString(),
        version_count: 0 // Will be populated by version control
      });
    }
  }
  
  return apps.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createApp(data: CreateAppData): Promise<AppInfo> {
  validateAppName(data.name);
  
  const appDir = path.join(APPS_DIR, data.name);
  
  try {
    await fs.access(appDir);
    throw new FileManagerError(`App '${data.name}' already exists`);
  } catch (error) {
    if (error instanceof FileManagerError) throw error;
    // Directory doesn't exist, which is what we want
  }
  
  await fs.mkdir(appDir, { recursive: true });
  
  // Create initial Python file
  const pythonContent = generatePythonTemplate(data.name, data.class_name, data.description);
  await fs.writeFile(path.join(appDir, `${data.name}.py`), pythonContent);
  
  // Create initial YAML file
  const yamlContent = generateYamlTemplate(data.name, data.class_name);
  await fs.writeFile(path.join(appDir, `${data.name}.yaml`), yamlContent);
  
  return {
    name: data.name,
    class_name: data.class_name,
    description: data.description || '',
    has_python: true,
    has_yaml: true,
    last_modified: new Date().toISOString(),
    version_count: 0
  };
}

export async function deleteApp(name: string): Promise<void> {
  validateAppName(name);
  
  const appDir = path.join(APPS_DIR, name);
  
  try {
    await fs.access(appDir);
  } catch {
    throw new AppNotFoundError(name);
  }
  
  await fs.rm(appDir, { recursive: true });
}

export async function readPythonFile(appName: string): Promise<FileContent> {
  validateAppName(appName);
  
  const filePath = path.join(APPS_DIR, appName, `${appName}.py`);
  
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
  
  const appDir = path.join(APPS_DIR, appName);
  const filePath = path.join(appDir, `${appName}.py`);
  
  try {
    await fs.access(appDir);
  } catch {
    throw new AppNotFoundError(appName);
  }
  
  await fs.writeFile(filePath, content);
}

export async function readYamlFile(appName: string): Promise<FileContent> {
  validateAppName(appName);
  
  const filePath = path.join(APPS_DIR, appName, `${appName}.yaml`);
  
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

export async function writeYamlFile(appName: string, content: string): Promise<void> {
  validateAppName(appName);
  
  const appDir = path.join(APPS_DIR, appName);
  const filePath = path.join(appDir, `${appName}.yaml`);
  
  try {
    await fs.access(appDir);
  } catch {
    throw new AppNotFoundError(appName);
  }
  
  await fs.writeFile(filePath, content);
}

function parseYaml(content: string): unknown {
  // Simple YAML parser - returns first key's value
  const lines = content.split('\n');
  const result: Record<string, unknown> = {};
  let currentKey = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (!line.startsWith(' ') && trimmed.endsWith(':')) {
      currentKey = trimmed.slice(0, -1);
      result[currentKey] = {};
    } else if (currentKey && line.startsWith('  ')) {
      const [key, ...valueParts] = trimmed.split(':');
      if (key && valueParts.length > 0) {
        (result[currentKey] as Record<string, string>)[key.trim()] = valueParts.join(':').trim();
      }
    }
  }
  
  return result;
}

function stringifyYaml(obj: Record<string, unknown>): string {
  // Simple YAML stringifier
  let result = '';
  
  for (const [key, value] of Object.entries(obj)) {
    result += `${key}:\n`;
    if (typeof value === 'object' && value !== null) {
      for (const [subKey, subValue] of Object.entries(value as Record<string, string>)) {
        result += `  ${subKey}: ${subValue}\n`;
      }
    }
  }
  
  return result;
}
