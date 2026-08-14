import "@noetis/noetis";

export interface DesktopCommand {
  readonly type: "create-note";
  readonly title: string;
}

export interface DesktopQuery {
  readonly type: "list-notes";
}

export interface DesktopNoetisClient {
  readonly submitCommand: (command: DesktopCommand) => Promise<void>;
  readonly runQuery: (query: DesktopQuery) => Promise<readonly unknown[]>;
}

// Keeps React isolated from the eventual shared application controller.
export function createDesktopNoetisClient(): DesktopNoetisClient {
  const submitCommand = (_command: DesktopCommand): Promise<void> =>
    Promise.reject(new Error("Noetis application command handler is not initialized."));

  const runQuery = (_query: DesktopQuery): Promise<readonly unknown[]> =>
    Promise.reject(new Error("Noetis application query handler is not initialized."));

  return {
    submitCommand,
    runQuery
  };
}
