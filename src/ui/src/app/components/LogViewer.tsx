'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Info, XCircle, Wifi, WifiOff } from 'lucide-react';
import { ParsedLogEntry } from '@/lib/log-reader';

const MAX_LOG_ENTRIES = 1000;

const LEVEL_CONFIG = {
  INFO: { color: 'text-ha-text', bg: 'bg-ha-surface', icon: Info },
  WARNING: { color: 'text-ha-warning', bg: 'bg-ha-warning-bg', icon: AlertTriangle },
  ERROR: { color: 'text-ha-error', bg: 'bg-ha-error-bg', icon: XCircle },
};

export function LogViewer({ activeApp }: { activeApp: string | null }) {
  const [logs, setLogs] = useState<ParsedLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<Set<'INFO' | 'WARNING' | 'ERROR'>>(
    new Set(['INFO', 'WARNING', 'ERROR'])
  );
  const [isPaused, setIsPaused] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const appendLog = useCallback((entry: ParsedLogEntry) => {
    setLogs(prev => prev.length >= MAX_LOG_ENTRIES
      ? [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]
      : [...prev, entry]
    );
  }, []);

  // Fetch existing logs immediately so the view isn't blank while SSE connects
  useEffect(() => {
    fetch('api/appdaemon-logs')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.logs?.length) {
          setLogs((data.logs as ParsedLogEntry[]).slice(-MAX_LOG_ENTRIES));
        }
      })
      .catch(() => { /* non-critical */ });
  }, []);

  useEffect(() => {
    const source = new EventSource('api/appdaemon-logs/stream');
    sourceRef.current = source;

    source.addEventListener('init', (e) => {
      try {
        const entries: ParsedLogEntry[] = JSON.parse(e.data);
        setLogs(entries.slice(-MAX_LOG_ENTRIES));
        setError(null);
        setConnected(true);
      } catch { /* malformed event */ }
    });

    source.addEventListener('log', (e) => {
      try {
        const entry: ParsedLogEntry = JSON.parse(e.data);
        appendLog(entry);
      } catch { /* malformed event */ }
    });

    source.addEventListener('error', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setError(data.error ?? 'Stream error');
      } catch { /* connection-level error, SSE will auto-reconnect */ }
    });

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [appendLog]);

  // Auto-scroll when not paused
  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const handleScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (!isAtBottom && !isPaused) setIsPaused(true);
    if (isAtBottom && isPaused) setIsPaused(false);
  };

  const toggleLevel = (level: 'INFO' | 'WARNING' | 'ERROR') => {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const filteredLogs = logs.filter(log =>
    selectedLevels.has(log.level as 'INFO' | 'WARNING' | 'ERROR') &&
    (showAll || !activeApp || log.source === activeApp)
  );

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

        <button
          onClick={() => setShowAll(v => !v)}
          className={`px-2 py-1 rounded-lg text-xs transition-colors ${
            showAll ? 'bg-ha-primary text-white' : 'bg-ha-surface text-ha-text-secondary'
          }`}
          title={showAll ? 'Showing all apps — click to filter by current app' : 'Showing current app only — click to show all'}
        >
          {showAll ? 'All apps' : activeApp ?? 'All apps'}
        </button>

        <div className="flex-1" />

        {/* Connection status */}
        <div
          className={`flex items-center gap-1 text-xs ${connected ? 'text-green-500' : 'text-ha-text-secondary'}`}
          title={connected ? 'Live' : 'Reconnecting…'}
        >
          {connected
            ? <Wifi className="w-3 h-3" />
            : <WifiOff className="w-3 h-3" />
          }
        </div>
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
            {connected ? 'No logs to display' : 'No logs yet…'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredLogs.map((log, index) => {
              const level = log.level as 'INFO' | 'WARNING' | 'ERROR';
              const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.INFO;
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
            onClick={() => {
              setIsPaused(false);
              if (logContainerRef.current)
                logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
            }}
            className="flex items-center gap-2 px-4 py-2 bg-ha-warning-bg hover:opacity-90 rounded-full text-ha-warning text-sm shadow-lg transition-colors"
          >
            ↓ Scroll to bottom
          </button>
        </div>
      )}
    </div>
  );
}
