import axios, { AxiosError } from 'axios';
import type {
  AppInfo,
  CreateAppData,
  VersionInfo,
  FileContent,
  LogEntry,
} from '@/types';

// Detect base URL - works with both Ingress and add-on proxy
// When served under a path (e.g., /app/56916952_appdaemon-studio/),
// we need to make API calls relative to that path
const getBaseUrl = () => {
  const path = window.location.pathname;
  // If we're under /app/<slug>/ or /hassio/ingress/<slug>/, use relative path
  if (path.includes('/app/') || path.includes('/ingress/')) {
    return './api';
  }
  // Otherwise use absolute path (direct access)
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleError = (error: unknown): never => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.detail || error.message;
    const statusCode = error.response?.status || 500;
    throw new ApiError(message, statusCode, error.response?.data);
  }
  throw new ApiError('Unknown error', 500, error);
};

// Apps API
export const getApps = async (): Promise<AppInfo[]> => {
  try {
    const response = await api.get<{ apps: AppInfo[]; count: number }>('/apps');
    return response.data.apps;
  } catch (error) {
    return handleError(error);
  }
};

export const createApp = async (data: CreateAppData): Promise<AppInfo> => {
  try {
    const response = await api.post<AppInfo>('/apps', data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const deleteApp = async (name: string): Promise<void> => {
  try {
    await api.delete(`/apps/${name}`);
  } catch (error) {
    return handleError(error);
  }
};

// Files API
export const getPythonFile = async (app: string): Promise<FileContent> => {
  try {
    const response = await api.get<FileContent>(`/files/${app}/python`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const savePythonFile = async (
  app: string,
  content: string
): Promise<FileContent> => {
  try {
    const response = await api.put<FileContent>(`/files/${app}/python`, {
      content,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const getYamlFile = async (app: string): Promise<FileContent> => {
  try {
    const response = await api.get<FileContent>(`/files/${app}/yaml`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const saveYamlFile = async (
  app: string,
  config: Record<string, unknown>
): Promise<FileContent> => {
  try {
    const response = await api.put<FileContent>(`/files/${app}/yaml`, config);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Versions API
export const getVersions = async (app: string): Promise<VersionInfo[]> => {
  try {
    const response = await api.get<{ versions: VersionInfo[]; count: number }>(`/versions/${app}`);
    return response.data.versions;
  } catch (error) {
    return handleError(error);
  }
};

export const getVersion = async (
  app: string,
  version: string
): Promise<FileContent> => {
  try {
    const response = await api.get<FileContent>(`/versions/${app}/${version}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const restoreVersion = async (
  app: string,
  version: string
): Promise<FileContent> => {
  try {
    const response = await api.post<FileContent>(
      `/versions/${app}/${version}/restore`
    );
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const deleteVersion = async (
  app: string,
  version: string
): Promise<void> => {
  try {
    await api.delete(`/versions/${app}/${version}`);
  } catch (error) {
    return handleError(error);
  }
};

export const cleanupVersions = async (
  app: string,
  keepCount: number
): Promise<void> => {
  try {
    await api.post(`/versions/${app}/cleanup`, { keep_count: keepCount });
  } catch (error) {
    return handleError(error);
  }
};

// Logs API
export const getLogs = async (params?: {
  lines?: number;
  level?: string;
}): Promise<LogEntry[]> => {
  try {
    const response = await api.get<LogEntry[]>('/logs', { params });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};
