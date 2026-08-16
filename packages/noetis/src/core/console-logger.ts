import { LogEntry, Logger } from "./logger";

// Sends storage logs to the JavaScript console.
export class ConsoleLogger implements Logger {
  debug(entry: LogEntry): void {
    console.info(entry.message, entry.data);
  }

  info(entry: LogEntry): void {
    console.info(entry.message, entry.data);
  }

  warn(entry: LogEntry): void {
    console.info(entry.message, entry.data);
  }

  error(entry: LogEntry): void {
    console.error(entry.message, entry.data);
  }
}
export { Logger };
