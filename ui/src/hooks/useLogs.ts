import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { logWebSocket } from '@/services/websocket';
import type { LogEntry, LogFilter, LogLevel } from '@/types';

interface UseLogsReturn {
  logs: LogEntry[];
  filteredLogs: LogEntry[];
  filter: LogFilter;
  paused: boolean;
  wsConnected: boolean;
  setFilter: (filter: LogFilter) => void;
  setPaused: (paused: boolean) => void;
  clearLogs: () => void;
}

export function useLogs(): UseLogsReturn {
  const {
    logs,
    filteredLogs,
    logFilter,
    logPaused,
    wsConnected,
    addLog,
    clearLogs,
    setLogFilter,
    setLogPaused,
    setWsConnected,
  } = useAppStore();

  useEffect(() => {
    logWebSocket.connect();

    const unsubscribeMessage = logWebSocket.onMessage((log: LogEntry) => {
      addLog(log);
    });

    const unsubscribeStatus = logWebSocket.onStatusChange((connected: boolean) => {
      setWsConnected(connected);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      logWebSocket.disconnect();
    };
  }, [addLog, setWsConnected]);

  const setFilter = useCallback(
    (filter: LogFilter): void => {
      setLogFilter(filter);
    },
    [setLogFilter]
  );

  const setPaused = useCallback(
    (paused: boolean): void => {
      setLogPaused(paused);
    },
    [setLogPaused]
  );

  return {
    logs,
    filteredLogs,
    filter: logFilter,
    paused: logPaused,
    wsConnected,
    setFilter,
    setPaused,
    clearLogs,
  };
}