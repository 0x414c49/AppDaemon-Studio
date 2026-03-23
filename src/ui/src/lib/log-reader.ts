export interface ParsedLogEntry {
  raw: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  source: string;
  message: string;
}

export function parseLogLine(line: string): ParsedLogEntry | null {
  if (!line || !line.trim()) {
    return null;
  }

  const infoMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+) (INFO|WARNING) (\w+): (.*)$/);
  if (infoMatch) {
    return {
      raw: line,
      timestamp: infoMatch[1],
      level: infoMatch[2] as 'INFO' | 'WARNING',
      source: infoMatch[3],
      message: infoMatch[4],
    };
  }

  const errorMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+) ERROR Error: (.*)$/);
  if (errorMatch) {
    return {
      raw: line,
      timestamp: errorMatch[1],
      level: 'ERROR',
      source: 'Error',
      message: errorMatch[2],
    };
  }

  return null;
}

export function parseAppDaemonLogs(raw: string): ParsedLogEntry[] {
  return raw
    .split('\n')
    .map(parseLogLine)
    .filter((e): e is ParsedLogEntry => e !== null);
}

export function filterLogsByApp(logs: ParsedLogEntry[], appName: string | null): ParsedLogEntry[] {
  if (!appName) {
    return logs;
  }
  return logs.filter(log => log.source === appName);
}

export function filterLogsByLevel(
  logs: ParsedLogEntry[],
  levels: Set<'INFO' | 'WARNING' | 'ERROR'>
): ParsedLogEntry[] {
  return logs.filter(log => levels.has(log.level));
}
