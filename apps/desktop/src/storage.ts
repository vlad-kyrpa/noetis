import {
  ConsoleLogger,
  CoreEngine,
  FileStorage,
  type CoreStorage,
} from "@noetis/noetis";
import { TauriFileSystemAdapter } from "./tauri-file-system";

// Creates the storage adapter backed by the Tauri commands implemented in Rust.
export function createDesktopFileStorage(): CoreStorage {
  return new FileStorage({
    fileSystem: new TauriFileSystemAdapter(),
    logger: new ConsoleLogger(),
  });
}

// Creates the desktop engine at the application boundary with platform storage injected.
export function createDesktopCoreEngine(): CoreEngine {
  return new CoreEngine({
    storage: createDesktopFileStorage(),
  });
}
