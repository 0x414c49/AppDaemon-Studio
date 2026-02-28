import React from 'react';
import {
  Clock,
  HardDrive,
  RotateCcw,
  Trash2,
  Broom,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useVersions } from '@/hooks/useVersions';
import { useAppStore } from '@/store/appStore';
import type { VersionInfo } from '@/types';

interface VersionItemProps {
  version: VersionInfo;
  onRestore: (version: string) => void;
  onDelete: (version: string) => void;
  isRestoring: boolean;
  isDeleting: string | null;
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  onRestore,
  onDelete,
  isRestoring,
  isDeleting,
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 border-b border-slate-800/50 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-slate-200 truncate">
            {formatDate(version.timestamp)}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatSize(version.size)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onRestore(version.version)}
          disabled={isRestoring}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors disabled:opacity-50"
        >
          {isRestoring ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          Restore
        </button>

        <button
          onClick={() => onDelete(version.version)}
          disabled={isDeleting === version.version}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50"
        >
          {isDeleting === version.version ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          Delete
        </button>
      </div>
    </div>
  );
};

export const VersionPanel: React.FC = () => {
  const {
    versions,
    isLoading,
    error,
    restoreVersion,
    deleteVersion,
    cleanupVersions,
  } = useVersions();

  const { activeApp } = useAppStore();
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [isCleaning, setIsCleaning] = React.useState(false);

  const handleRestore = async (version: string) => {
    if (
      window.confirm(
        `Are you sure you want to restore version ${version}? This will overwrite the current file.`
      )
    ) {
      setIsRestoring(true);
      try {
        await restoreVersion(version);
      } finally {
        setIsRestoring(false);
      }
    }
  };

  const handleDelete = async (version: string) => {
    if (window.confirm(`Are you sure you want to delete version ${version}?`)) {
      setIsDeleting(version);
      try {
        await deleteVersion(version);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleCleanup = async () => {
    if (
      window.confirm(
        `This will keep only the last 10 versions. Are you sure?`
      )
    ) {
      setIsCleaning(true);
      try {
        await cleanupVersions(10);
      } finally {
        setIsCleaning(false);
      }
    }
  };

  if (!activeApp) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-2 text-slate-700" />
          <p>Select an app to view version history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="font-medium text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Version History for {activeApp}
        </h3>

        {versions.length > 10 && (
          <button
            onClick={handleCleanup}
            disabled={isCleaning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
          >
            {isCleaning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Broom className="w-3.5 h-3.5" />
            )}
            Clean Old (keep 10)
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && versions.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-2 text-slate-700" />
            <p>No versions available</p>
            <p className="text-sm text-slate-600 mt-1">
              Versions are created when you save files
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && versions.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {versions.map((version) => (
            <VersionItem
              key={version.version}
              version={version}
              onRestore={handleRestore}
              onDelete={handleDelete}
              isRestoring={isRestoring}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
};
