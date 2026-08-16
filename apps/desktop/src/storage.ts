import { ConsoleLogger, FileStorage } from "@noetis/noetis";
import { TauriFileSystemAdapter } from "./tauri-file-system";

export function createDesktopFileStorage(): FileStorage {
  return new FileStorage({
    fileSystem: new TauriFileSystemAdapter(),
    logger: new ConsoleLogger(),
  });
}
