import { promises as fs } from 'fs';
import path from 'path';
import { VersionInfo, FileContent } from '../types';

const APPS_DIR = '/config/apps';

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

function getVersionsDir(appName: string): string {
  return path.join(APPS_DIR, appName, '.versions');
}

function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14); // YYYYMMDDHHMMSS (14 characters)
}

export async function createVersion(
  appName: string,
  filename: string,
  content: string
): Promise<string> {
  const versionsDir = getVersionsDir(appName);
  
  // Ensure versions directory exists
  await fs.mkdir(versionsDir, { recursive: true });
  
  const timestamp = generateTimestamp();
  const versionFile = path.join(versionsDir, `${timestamp}_${filename}`);
  
  await fs.writeFile(versionFile, content);
  
  return timestamp;
}

export async function listVersions(appName: string): Promise<VersionInfo[]> {
  const versionsDir = getVersionsDir(appName);
  
  try {
    await fs.access(versionsDir);
  } catch {
    return [];
  }
  
  const entries = await fs.readdir(versionsDir);
  const versions: VersionInfo[] = [];
  
  for (const entry of entries) {
    const match = entry.match(/^(\d{14})_(.+)$/);
    if (match) {
      const [, timestamp, filename] = match;
      const filePath = path.join(versionsDir, entry);
      const stats = await fs.stat(filePath);
      
      versions.push({
        version: timestamp,
        timestamp: formatTimestamp(timestamp),
        size: stats.size,
        filename
      });
    }
  }
  
  // Sort by timestamp descending
  return versions.sort((a, b) => b.version.localeCompare(a.version));
}

export async function getVersion(
  appName: string,
  version: string
): Promise<FileContent> {
  const versionsDir = getVersionsDir(appName);
  const appDir = path.join(APPS_DIR, appName);
  
  // Find the version file
  const entries = await fs.readdir(versionsDir).catch(() => [] as string[]);
  const versionFile = entries.find(e => e.startsWith(version));
  
  if (!versionFile) {
    throw new VersionNotFoundError(version);
  }
  
  const filePath = path.join(versionsDir, versionFile);
  const content = await fs.readFile(filePath, 'utf-8');
  
  return {
    content,
    last_modified: formatTimestamp(version)
  };
}

export async function restoreVersion(
  appName: string,
  version: string
): Promise<FileContent> {
  const versionsDir = getVersionsDir(appName);
  const appDir = path.join(APPS_DIR, appName);
  
  // Find the version file
  const entries = await fs.readdir(versionsDir).catch(() => [] as string[]);
  const versionFile = entries.find(e => e.startsWith(version));
  
  if (!versionFile) {
    throw new VersionNotFoundError(version);
  }
  
  // Extract filename from version file
  const match = versionFile.match(/^\d{8}_\d{6}_(.+)$/);
  if (!match) {
    throw new VersionControlError(`Invalid version file format: ${versionFile}`);
  }
  
  const filename = match[1];
  const versionPath = path.join(versionsDir, versionFile);
  const targetPath = path.join(appDir, filename);
  
  // Read version content
  const content = await fs.readFile(versionPath, 'utf-8');
  
  // Write to target file
  await fs.writeFile(targetPath, content);
  
  return {
    content,
    last_modified: new Date().toISOString()
  };
}

export async function deleteVersion(appName: string, version: string): Promise<void> {
  const versionsDir = getVersionsDir(appName);
  
  const entries = await fs.readdir(versionsDir).catch(() => [] as string[]);
  const versionFile = entries.find(e => e.startsWith(version));
  
  if (!versionFile) {
    throw new VersionNotFoundError(version);
  }
  
  const filePath = path.join(versionsDir, versionFile);
  await fs.unlink(filePath);
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
  // Convert YYYYMMDDHHMMSS (14 chars) to ISO string
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const second = timestamp.slice(12, 14);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}
