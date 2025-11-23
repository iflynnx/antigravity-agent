//! 数据库监控相关命令
//! 提供数据库监控状态的查询和控制功能

use tauri::{AppHandle, Manager};
use crate::db_monitor::DatabaseMonitor;
use std::sync::Arc;

/// 获取数据库监控运行状态
#[tauri::command]
pub async fn is_database_monitoring_running(
    app: AppHandle,
) -> Result<bool, String> {
    crate::log_async_command!("is_database_monitoring_running", async {
        let settings_manager = app.state::<crate::app_settings::AppSettingsManager>();
        let settings = settings_manager.get_settings();
        Ok(settings.db_monitoring_enabled)
    })
}

/// 手动启动数据库监控
#[tauri::command]
pub async fn start_database_monitoring(
    app: AppHandle,
) -> Result<String, String> {
    crate::log_async_command!("start_database_monitoring", async {
        let monitor = app.state::<Arc<DatabaseMonitor>>();
        monitor.start_monitoring().await
            .map_err(|e| format!("启动监控失败: {}", e))?;
        Ok("数据库监控已启动".to_string())
    })
}

/// 手动停止数据库监控
#[tauri::command]
pub async fn stop_database_monitoring(
    app: AppHandle,
) -> Result<String, String> {
    crate::log_async_command!("stop_database_monitoring", async {
        let monitor = app.state::<Arc<DatabaseMonitor>>();
        monitor.stop_monitoring().await;
        Ok("数据库监控已停止".to_string())
    })
}