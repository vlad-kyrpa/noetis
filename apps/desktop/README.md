# Noetis Desktop

This package is the Tauri desktop shell for Noetis. The UI is a React/Vite app, and Tauri provides the native desktop window plus a bridge to Rust code for OS-level features like file access.

## Requirements

- Node.js
- pnpm
- Rust
- Tauri system dependencies for your OS

Install JavaScript dependencies from the repo root:

```powershell
pnpm install
```

## Commands

Run the desktop app in development:

```powershell
cd apps/desktop
pnpm tauri dev
```

Run only the web frontend in a browser:

```powershell
cd apps/desktop
pnpm dev
```

Typecheck the desktop frontend:

```powershell
cd apps/desktop
pnpm typecheck
```

Build the frontend:

```powershell
cd apps/desktop
pnpm build
```

Build the packaged desktop app:

```powershell
cd apps/desktop
pnpm tauri build
```

## Project Layout

```text
apps/desktop/
  src/                 React/Vite frontend
  src-tauri/           Tauri and Rust desktop shell
  src-tauri/src/       Rust app entrypoint and native commands
  src-tauri/tauri.conf.json
                       Tauri window, build, bundle, and security config
```

During development, `pnpm tauri dev` starts Vite on port `1420` and opens it inside a native Tauri window.

During production builds, Vite writes static files to `dist`, and Tauri bundles those files into the desktop app.

## When To Edit `src-tauri`

Most UI work happens in `src/`.

Edit `src-tauri/` when the app needs native desktop behavior:

- reading or writing local files
- managing an Obsidian-compatible vault on disk
- opening files, folders, or URLs
- app menus, tray icons, native dialogs, notifications
- packaging, icons, signing, updater config
- Rust commands called from the frontend

## Tauri Bridge

The Tauri bridge lets the frontend call Rust commands with `invoke`.

Frontend example:

```ts
import { invoke } from "@tauri-apps/api/core";

await invoke("write_markdown_file", {
  path: "Notes/Example.md",
  contents: "# Example\n\nHello from Noetis.\n"
});
```

Rust command example:

```rust
#[tauri::command]
fn write_markdown_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(path, contents).map_err(|error| error.to_string())
}
```

Register the command in `src-tauri/src/lib.rs`:

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![write_markdown_file])
        .run(tauri::generate_context!())
        .expect("error while running noetis desktop application");
}
```

After registering a Rust command, restart `pnpm tauri dev`. Frontend-only changes usually hot reload, but Rust/Tauri changes need a restart or rebuild.

## File Storage Notes

For Obsidian compatibility, store notes as real files on disk, usually Markdown files inside a user-selected vault directory.

Recommended shape:

```text
vault/
  Notes/
    Example.md
  Daily/
    2026-08-15.md
  .noetis/
    metadata.json
```

Keep user-facing content in normal Markdown files so Obsidian can read it directly. If Noetis needs private app metadata, put it in a small hidden folder like `.noetis/` instead of embedding everything into the Markdown body.

Avoid writing beside the installed app files. Use either:

- a user-selected vault folder for Obsidian-compatible content
- the app data directory for internal settings/cache

## Current Tauri Plugins

The desktop app currently enables:

```text
tauri-plugin-opener
```

Its permission is configured in:

```text
src-tauri/capabilities/default.json
```

Add more plugins and permissions only when the frontend needs those capabilities.
