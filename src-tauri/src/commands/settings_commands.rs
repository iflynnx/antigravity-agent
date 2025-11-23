//! 应用设置命令
//! 负责应用程序配置的管理和存储，使用 State 模式

use tauri::{AppHandle, Manager};

/// 获取数据库监控状态
#[tauri::command]
pub async fn is_db_monitoring_enabled(
    app: AppHandle,
) -> Result<bool, String> {
    crate::log_async_command!("is_db_monitoring_enabled", async {
        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();
        let settings = settings_manager.get_settings();
        Ok(settings.db_monitoring_enabled)
    })
}

/// 保存数据库监控状态
#[tauri::command]
pub async fn save_db_monitoring_state(
    app: AppHandle,
    enabled: bool,
) -> Result<String, String> {
    crate::log_async_command!("save_db_monitoring_state", async {
        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();

        settings_manager.update_settings(|settings| {
            settings.db_monitoring_enabled = enabled;
        })?;

        let status_text = if enabled { "已启用" } else { "已禁用" };
        Ok(format!("数据库监控{}", status_text))
    })
}

/// 获取所有应用设置
#[tauri::command]
pub async fn get_all_settings(
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    crate::log_async_command!("get_all_settings", async {
        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();
        let settings = settings_manager.get_settings();

        Ok(serde_json::json!({
            "system_tray_enabled": settings.system_tray_enabled,
            "db_monitoring_enabled": settings.db_monitoring_enabled
        }))
    })
}