export interface AppInfo {
  name: string;
  class_name: string;
  description: string;
  has_python: boolean;
  has_yaml: boolean;
  last_modified: string;
  version_count: number;
  icon?: string;
  disabled?: boolean;
}

export interface CreateAppData {
  name: string;
  class_name: string;
  description?: string;
  icon?: string; // Icon name from lucide-react
}

export interface FileContent {
  content: string;
  last_modified: string;
}

export interface VersionInfo {
  version: string;
  timestamp: string;
  size: number;
  filename: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface AppState {
  apps: AppInfo[];
  activeApp: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppConfig {
  module: string;
  class: string;
  description?: string;
  icon?: string;
  [key: string]: any;
}

export interface AppsConfig {
  [appName: string]: AppConfig;
}
