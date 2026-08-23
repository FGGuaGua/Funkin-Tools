use std::fs;
use std::path::Path;
use tauri::command;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![read_custom_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



#[command]
fn read_custom_directory(path: String) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(Path::new(&path))
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            entry.ok().and_then(|e| {
                e.file_name().into_string().ok()
            })
        })
        .collect();

    Ok(entries)
}