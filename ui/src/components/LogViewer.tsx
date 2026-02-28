import React from 'react';
import {
  Filter,
  Pause,
  Play,
  Trash2,
  Wifi,
  WifiOff,
  AlertCircle,
} from 'lucide-react';
import { useLogs } from '@/hooks/useLogs';
import type { LogLevel, LogFilter } from '@/types';

const LOG_LEVELS: { value: LogFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'text-slate-300' },
  { value: 'debug', label: 'DEBUG', color: 'text-slate-500' },
  { value: 'info', label: 'INFO', color: 'text-blue-400' },
  { value: 'warning', label: 'WARNING', color: 'text-yellow-400' },
  { value: 'error', label: 'ERROR', color: 'text-red-400' },
];

const getLevelColor = (level: LogLevel): string => {
  switch (level) {
    case 'DEBUG':
      return 'text-slate-500';
    case 'INFO':
      return 'text-blue-400';
    case 'WARNING':
      return 'text-yellow-400';
    case 'ERROR':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
};

export const LogViewer: React.FC = () => {
  const { filteredLogs, filter, paused, wsConnected, setFilter, setPaused, clearLogs } =
    useLogs();

  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logContainerRef.current && !paused) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, paused]);

  return (
    <div data-testid="log-viewer" className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1">
            {LOG_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setFilter(level.value)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  filter === level.value
                    ? 'bg-slate-700 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wsConnected ? (
            <Wifi className="w-4 h-4 text-green-500" aria-label="Connected" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" aria-label="Disconnected" />
          )}

          <button
            onClick={() => setPaused(!paused)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              paused
                ? 'bg-yellow-600/20 text-yellow-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {paused ? (
              <>
                <Play className="w-3.5 h-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause
              </>
            )}
          </button>

          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Log list */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto font-mono text-xs"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-700" />
              <p>No logs to display</p>
              <p className="text-sm text-slate-600 mt-1">
                Logs will appear here in real-time
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 px-4 py-1 hover:bg-slate-800/50"
              >
                <span className="text-slate-600 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`font-semibold whitespace-nowrap w-16 ${getLevelColor(
                    log.level
                  )}`}
                >
                  {log.level}
                </span>
                {log.app && (
                  <span className="text-slate-400 whitespace-nowrap">
                    [{log.app}]
                  </span>
                )}
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        )}

        {paused && (
          <div className="sticky bottom-0 bg-yellow-600/20 text-yellow-400 px-4 py-2 text-center text-sm">
            Log stream paused. Click Resume to continue.
          </div>
        )}
      </div>
    </div>
  );
};
