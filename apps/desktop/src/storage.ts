import {
  ConsoleLogger,
  CoreEngine,
  FileStorage,
} from "@noetis/noetis";
import { TauriFileSystemAdapter } from "./tauri-file-system";

const desktopLogger = new ConsoleLogger();
const desktopFileStorage = new FileStorage({
  fileSystem: new TauriFileSystemAdapter(),
  logger: desktopLogger,
});
const desktopCoreEngine = new CoreEngine({
  storage: desktopFileStorage,
});

// Creates the storage adapter backed by the Tauri commands implemented in Rust.
export function createDesktopFileStorage(): FileStorage {
  return desktopFileStorage;
}

// Generates the search index at the desktop app boundary before UI reads begin.
export async function initializeDesktopFileStorage(): Promise<void> {
  try {
    await desktopFileStorage.generateRecordIndexFromExistingFiles();
  } catch (error: unknown) {
    desktopLogger.error({
      message: "Desktop file storage initialization failed.",
      data: { error },
    });
  }
}

// Creates the desktop engine at the application boundary with platform storage injected.
export function createDesktopCoreEngine(): CoreEngine {
  return desktopCoreEngine;
}
