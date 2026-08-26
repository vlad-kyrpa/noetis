import { invoke } from "@tauri-apps/api/core";
import type { FileSystemAdapter } from "@noetis/noetis";

export class TauriFileSystemAdapter implements FileSystemAdapter {
  async isExists(path: string): Promise<boolean> {
    return invoke<boolean>("noetis_fs_exists", { path });
  }

  async isFile(path: string): Promise<boolean> {
    return invoke<boolean>("noetis_fs_is_file", { path });
  }

  async isDirectory(path: string): Promise<boolean> {
    return invoke<boolean>("noetis_fs_is_directory", { path });
  }

  async getDirectoryContent(directoryPath: string): Promise<readonly string[]> {
    return invoke<string[]>("noetis_fs_read_directory", { directoryPath });
  }

  async getFileContent(path: string): Promise<string> {
    return invoke<string>("noetis_fs_read_text_file", { path });
  }

  async writeFileContent(path: string, content: string): Promise<void> {
    await invoke("noetis_fs_write_text_file", { path, content });
  }

  async removeFile(path: string): Promise<void> {
    await invoke("noetis_fs_remove_file", { path });
  }

  async createDirectory(path: string): Promise<void> {
    await invoke("noetis_fs_create_directory", { path });
  }

  async getRootDirectory(): Promise<string> {
    return invoke<string>("noetis_fs_get_root_directory");
  }

  async getRelativePath(path: string): Promise<string> {
    return invoke<string>("noetis_fs_get_relative_path", { path });
  }

  async getDirectoryName(path: string): Promise<string> {
    return invoke<string>("noetis_fs_get_directory_name", { path });
  }

  async combinePaths(parts: readonly string[]): Promise<string> {
    return invoke<string>("noetis_fs_combine_paths", { parts });
  }
}
