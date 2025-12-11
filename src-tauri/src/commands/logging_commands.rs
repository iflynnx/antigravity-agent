/// 日志和加密命令
/// 负责日志管理、文件写入、数据加密解密等功能
use std::fs;
use std::path::Path;

/// 写入文本文件
/// 将文本内容写入指定路径的文件
#[tauri::command]
pub async fn write_text_file(path: String, content: String) -> Result<String, String> {
    crate::log_async_command!("write_text_file", async {
        let file_path = Path::new(&path);

        // 确保父目录存在
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }

        // 写入文件
        fs::write(file_path, content).map_err(|e| format!("写入文件失败: {}", e))?;

        Ok(format!("文件写入成功: {}", path))
    })
}

/// 写入前端日志
/// 将前端日志条目写入到后端日志系统
#[tauri::command]
pub async fn write_frontend_log(log_entry: serde_json::Value) -> Result<(), String> {
    use tracing::{debug, error, info, warn};

    // 解析日志级别
    let level = log_entry
        .get("level")
        .and_then(|v| v.as_str())
        .unwrap_or("info");

    // 解析消息
    let message = log_entry
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    // 解析模块名
    let module = log_entry
        .get("module")
        .and_then(|v| v.as_str())
        .unwrap_or("frontend");

    // 解析额外的数据
    let extra_data = log_entry.get("data");

    // 构建完整的日志消息
    let full_message = if let Some(data) = extra_data {
        format!("[{}] {}", module, data)
    } else {
        format!("[{}] {}", module, message)
    };

    // 根据级别输出日志 'info' | 'warn' | 'error' | 'debug'
    match level {
        "error" => error!(target = format!("frontend::{}", module), "{}", full_message),
        "warn" => warn!(target = format!("frontend::{}", module), "{}", full_message),
        "debug" => debug!(target = format!("frontend::{}", module), "{}", full_message),
        _ => info!(target = format!("frontend::{}", module), "{}", full_message),
    }

    Ok(())
}
