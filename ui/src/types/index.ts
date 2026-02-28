export interface AppInfo {
  name: string;
  class_name: string;
  description: string;
  has_python: boolean;
  has_yaml: boolean;
  last_modified: string;
  version_count: number;
}

export interface CreateAppData {
  name: string;
  class_name: string;
  description: string;
}

export interface VersionInfo {
  version: string;
  timestamp: string;
  size: number;
  filename: string;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  app?: string;
  message: string;
}

export interface FileContent {
  content: string;
  last_modified: string;
}

export type FileType = 'python' | 'yaml';

export type BottomPanelTab = 'logs' | 'versions';

export type LogFilter = 'all' | 'debug' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}