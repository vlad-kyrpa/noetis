export type LogEntry = {
  message: string;
  data: Record<string, unknown>;
};

export interface Logger {
  debug: (entry: LogEntry) => void;
  info: (entry: LogEntry) => void;
  warn: (entry: LogEntry) => void;
  error: (entry: LogEntry) => void;
}
