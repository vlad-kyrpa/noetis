use std::{
    fs,
    path::{Component, Path, PathBuf},
};
use tauri::{AppHandle, Manager};

fn noetis_root_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))?
        .join("noetis");

    fs::create_dir_all(&root)
        .map_err(|error| format!("Failed to create Noetis storage directory: {error}"))?;

    Ok(root)
}

fn safe_noetis_path(app: &AppHandle, path: &str) -> Result<PathBuf, String> {
    let root = noetis_root_directory(app)?;
    let requested_path = PathBuf::from(path);

    if !requested_path.is_absolute() {
        return Err("Noetis filesystem paths must be absolute.".to_string());
    }

    reject_parent_traversal(&requested_path)?;

    if !requested_path.starts_with(&root) {
        return Err("Noetis filesystem path is outside the storage directory.".to_string());
    }

    Ok(requested_path)
}

fn reject_parent_traversal(path: &Path) -> Result<(), String> {
    if path
        .components()
        .any(|component| matches!(component, Component::ParentDir))
    {
        return Err("Noetis filesystem paths cannot contain parent traversal.".to_string());
    }

    Ok(())
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

#[tauri::command]
fn noetis_fs_get_root_directory(app: AppHandle) -> Result<String, String> {
    noetis_root_directory(&app).map(|path| path_to_string(&path))
}

#[tauri::command]
fn noetis_fs_exists(app: AppHandle, path: String) -> Result<bool, String> {
    Ok(safe_noetis_path(&app, &path)?.exists())
}

#[tauri::command]
fn noetis_fs_is_file(app: AppHandle, path: String) -> Result<bool, String> {
    Ok(safe_noetis_path(&app, &path)?.is_file())
}

#[tauri::command]
fn noetis_fs_is_directory(app: AppHandle, path: String) -> Result<bool, String> {
    Ok(safe_noetis_path(&app, &path)?.is_dir())
}

#[tauri::command]
fn noetis_fs_read_directory(app: AppHandle, directory_path: String) -> Result<Vec<String>, String> {
    let directory_path = safe_noetis_path(&app, &directory_path)?;

    if !directory_path.exists() {
        return Ok(vec![]);
    }

    let entries = fs::read_dir(directory_path)
        .map_err(|error| format!("Failed to read Noetis directory: {error}"))?
        .map(|entry| {
            entry
                .map(|entry| path_to_string(&entry.path()))
                .map_err(|error| format!("Failed to read Noetis directory entry: {error}"))
        })
        .collect::<Result<Vec<String>, String>>()?;

    Ok(entries)
}

#[tauri::command]
fn noetis_fs_read_text_file(app: AppHandle, path: String) -> Result<String, String> {
    let path = safe_noetis_path(&app, &path)?;
    fs::read_to_string(path).map_err(|error| format!("Failed to read Noetis file: {error}"))
}

#[tauri::command]
fn noetis_fs_write_text_file(app: AppHandle, path: String, content: String) -> Result<(), String> {
    let path = safe_noetis_path(&app, &path)?;

    if let Some(parent_path) = path.parent() {
        fs::create_dir_all(parent_path)
            .map_err(|error| format!("Failed to create Noetis directory: {error}"))?;
    }

    fs::write(path, content).map_err(|error| format!("Failed to write Noetis file: {error}"))
}

#[tauri::command]
fn noetis_fs_remove_file(app: AppHandle, path: String) -> Result<(), String> {
    let path = safe_noetis_path(&app, &path)?;
    fs::remove_file(path).map_err(|error| format!("Failed to remove Noetis file: {error}"))
}

#[tauri::command]
fn noetis_fs_create_directory(app: AppHandle, path: String) -> Result<(), String> {
    let path = safe_noetis_path(&app, &path)?;
    fs::create_dir_all(path).map_err(|error| format!("Failed to create Noetis directory: {error}"))
}

#[tauri::command]
fn noetis_fs_get_relative_path(app: AppHandle, path: String) -> Result<String, String> {
    let root = noetis_root_directory(&app)?;
    let path = safe_noetis_path(&app, &path)?;
    let relative_path = path
        .strip_prefix(root)
        .map_err(|error| format!("Failed to resolve Noetis relative path: {error}"))?;

    Ok(path_to_string(relative_path))
}

#[tauri::command]
fn noetis_fs_get_directory_name(app: AppHandle, path: String) -> Result<String, String> {
    let path = safe_noetis_path(&app, &path)?;
    path.parent()
        .map(path_to_string)
        .ok_or_else(|| "Noetis filesystem path does not have a parent directory.".to_string())
}

#[tauri::command]
fn noetis_fs_combine_paths(app: AppHandle, parts: Vec<String>) -> Result<String, String> {
    let mut combined_path = PathBuf::new();

    for part in parts.iter().filter(|part| !part.is_empty()) {
        let part_path = PathBuf::from(part);
        reject_parent_traversal(&part_path)?;

        if part_path.is_absolute() && !combined_path.as_os_str().is_empty() {
            return Err(
                "Noetis filesystem path can only include an absolute path as the first part."
                    .to_string(),
            );
        }

        combined_path.push(part_path);
    }

    let combined_path = path_to_string(&combined_path);
    safe_noetis_path(&app, &combined_path).map(|path| path_to_string(&path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            noetis_fs_get_root_directory,
            noetis_fs_exists,
            noetis_fs_is_file,
            noetis_fs_is_directory,
            noetis_fs_read_directory,
            noetis_fs_read_text_file,
            noetis_fs_write_text_file,
            noetis_fs_remove_file,
            noetis_fs_create_directory,
            noetis_fs_get_relative_path,
            noetis_fs_get_directory_name,
            noetis_fs_combine_paths,
        ])
        .run(tauri::generate_context!())
        .expect("error while running noetis desktop application");
}
