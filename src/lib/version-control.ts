import { promises as fs } from 'fs';
import path from 'path';
import { VersionInfo, FileContent } from '@/types';

const APPS_DIR = '/config/apps';
const VERSIONS_DIR = '/config/apps/.versions';

export class VersionNotFoundError extends Error {
  constructor(version: string) {
    super(`Version '${version}' not found`);
    this.name = 'VersionNotFoundError';
  }
}

export class VersionControlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VersionControlError';
  }
}

async function ensureVersionsDir(): Promise<void> {
  try {
    await fs.access(VERSIONS_DIR);
  } catch {
    await fs.mkdir(VERSIONS_DIR, { recursive: true });
  }
}

function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);
}

export async function createVersion(
  appName: string,
  content: string
): Promise<string> {
  await ensureVersionsDir();
  
  const timestamp = generateTimestamp();
  const versionFile = path.join(VERSIONS_DIR, `${appName}_${timestamp}.py`);
  
  await fs.writeFile(versionFile, content);
  
  return timestamp;
}

export async function listVersions(appName: string): Promise<VersionInfo[]> {
  try {
    await ensureVersionsDir();
  } catch (error) {
    return [];
  }

  try {
    const entries = await fs.readdir(VERSIONS_DIR);

    const versions: VersionInfo[] = [];

    for (const entry of entries) {
      const match = entry.match(new RegExp(`^${appName}_(\\d{14})\\.py$`));
      if (match) {
        const timestamp = match[1];
        const filePath = path.join(VERSIONS_DIR, entry);
        const stats = await fs.stat(filePath);

        versions.push({
          version: timestamp,
          timestamp: formatTimestamp(timestamp),
          size: stats.size,
          filename: entry
        });
      }
    }

    return versions.sort((a, b) => b.version.localeCompare(a.version));
  } catch (error) {
    return [];
  }
}

export async function getVersion(
  appName: string,
  version: string
): Promise<FileContent> {
  const versionFile = path.join(VERSIONS_DIR, `${appName}_${version}.py`);
  
  try {
    const content = await fs.readFile(versionFile, 'utf-8');
    const stats = await fs.stat(versionFile);
    
    return {
      content,
      last_modified: stats.mtime.toISOString()
    };
  } catch {
    throw new VersionNotFoundError(version);
  }
}

export async function restoreVersion(
  appName: string,
  version: string
): Promise<FileContent> {
  const versionPath = path.join(VERSIONS_DIR, `${appName}_${version}.py`);
  const targetPath = path.join(APPS_DIR, `${appName}.py`);
  
  try {
    const content = await fs.readFile(versionPath, 'utf-8');
    await fs.writeFile(targetPath, content);
    
    return {
      content,
      last_modified: new Date().toISOString()
    };
  } catch {
    throw new VersionNotFoundError(version);
  }
}

export async function deleteVersion(appName: string, version: string): Promise<void> {
  const versionFile = path.join(VERSIONS_DIR, `${appName}_${version}.py`);
  
  try {
    await fs.unlink(versionFile);
  } catch {
    throw new VersionNotFoundError(version);
  }
}

export async function cleanupVersions(appName: string, keepCount: number): Promise<void> {
  const versions = await listVersions(appName);
  
  if (versions.length <= keepCount) {
    return;
  }
  
  const versionsToDelete = versions.slice(keepCount);
  
  for (const version of versionsToDelete) {
    await deleteVersion(appName, version.version);
  }
}

export async function getVersionCount(appName: string): Promise<number> {
  const versions = await listVersions(appName);
  return versions.length;
}

function formatTimestamp(timestamp: string): string {
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const second = timestamp.slice(12, 14);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}
