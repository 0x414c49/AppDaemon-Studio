'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Info, XCircle, Play, Pause } from 'lucide-react';
import { ParsedLogEntry } from '@/lib/log-reader';

const NORMAL_POLL_INTERVAL = 5000;
const FAST_POLL_INTERVAL = 1500;
const FAST_POLL_DURATION = 10000;

const LEVEL_CONFIG = {
  INFO: { color: 'text-ha-text', bg: 'bg-ha-surface', icon: Info },
  WARNING: { color: 'text-ha-warning', bg: 'bg-ha-warning-bg', icon: AlertTriangle },
  ERROR: { color: 'text-ha-error', bg: 'bg-ha-error-bg', icon: XCircle },
};

export function LogViewer() {
  const [logs, setLogs] = useState<ParsedLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<Set<'INFO' | 'WARNING' | 'ERROR'>>(
    new Set(['INFO', 'WARNING', 'ERROR'])
  );
  const [isPaused, setIsPaused] = useState(false);
  const [lastFileChange, setLastFileChange] = useState<number>(0);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fastPollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(async () => {
    if (isPaused) return;

    setIsLoading(true);
    try {
      const response = await fetch('api/appdaemon-logs');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch logs');
        return;
      }

      setLogs(data.logs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  }, [isPaused]);

  useEffect(() => {
    if (!isAutoRefresh || isPaused) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const isFastPoll = Date.now() - lastFileChange < FAST_POLL_DURATION;
    const interval = isFastPoll ? FAST_POLL_INTERVAL : NORMAL_POLL_INTERVAL;

    fetchLogs();
    pollIntervalRef.current = setInterval(fetchLogs, interval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isAutoRefresh, isPaused, fetchLogs, lastFileChange]);

  useEffect(() => {
    if (lastFileChange === 0) return;

    if (fastPollTimeoutRef.current) {
      clearTimeout(fastPollTimeoutRef.current);
    }

    fastPollTimeoutRef.current = setTimeout(() => {
      setLastFileChange(0);
    }, FAST_POLL_DURATION);
  }, [lastFileChange]);

  useEffect(() => {
    const handleFileChange = () => {
      setLastFileChange(Date.now());
    };

    window.addEventListener('appdaemon-file-changed', handleFileChange);
    return () => {
      window.removeEventListener('appdaemon-file-changed', handleFileChange);
    };
  }, []);

  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const toggleLevel = (level: 'INFO' | 'WARNING' | 'ERROR') => {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const handleScroll = () => {
    if (!logContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (!isAtBottom && !isPaused) {
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    fetchLogs();
  };

  const filteredLogs = logs.filter(log => selectedLevels.has(log.level)).slice().reverse();

  return (
    <div className="flex flex-col h-full min-h-0 bg-ha-bg">
      <div className="flex items-center gap-3 p-3 border-b border-ha-border bg-ha-card">
        <div className="flex items-center gap-1">
          {(['INFO', 'WARNING', 'ERROR'] as const).map(level => {
            const config = LEVEL_CONFIG[level];
            const isActive = selectedLevels.has(level);
            const Icon = config.icon;
            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                  isActive ? config.bg : 'bg-ha-surface opacity-50'
                }`}
                title={`Toggle ${level}`}
              >
                <Icon className={`w-3 h-3 ${isActive ? config.color : 'text-ha-text-secondary'}`} />
                <span className={isActive ? config.color : 'text-ha-text-secondary'}>{level}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 bg-ha-surface hover:bg-ha-surface-hover rounded-lg text-xs text-ha-text transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            isAutoRefresh ? 'bg-ha-surface-active text-ha-primary' : 'bg-ha-surface text-ha-text-secondary'
          }`}
          title={isAutoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
        >
          <Play className="w-3 h-3" />
          Auto
        </button>

        {isPaused && (
          <button
            onClick={handleResume}
            className="flex items-center gap-1 px-2 py-1 bg-ha-warning-bg hover:opacity-90 rounded-lg text-xs text-ha-warning transition-colors"
          >
            <Pause className="w-3 h-3" />
            Resume
          </button>
        )}
      </div>

      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto font-mono text-xs p-2 pb-16"
      >
        {error ? (
          <div className="flex items-center justify-center h-full text-ha-error">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-ha-text-secondary">
            No logs to display
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredLogs.map((log, index) => {
              const config = LEVEL_CONFIG[log.level];
              const Icon = config.icon;
              return (
                <div
                  key={`${log.timestamp}-${index}`}
                  className={`flex items-start gap-2 px-2 py-0.5 rounded ${config.bg}`}
                >
                  <span className="text-ha-text-secondary shrink-0">
                    {log.timestamp.split(' ')[1]}
                  </span>
                  <Icon className={`w-3 h-3 shrink-0 mt-0.5 ${config.color}`} />
                  <span className={`shrink-0 font-medium ${config.color}`}>
                    {log.source}
                  </span>
                  <span className="text-ha-text break-all">
                    {log.message}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isPaused && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handleResume}
            className="flex items-center gap-2 px-4 py-2 bg-ha-warning-bg hover:opacity-90 rounded-full text-ha-warning text-sm shadow-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Resume
          </button>
        </div>
      )}
    </div>
  );
}
