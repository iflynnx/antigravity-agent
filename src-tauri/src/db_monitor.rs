//! 数据库自动监控模块
//! 负责定时检查 Antigravity 数据库变化并推送事件到前端

use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};
use serde_json::Value;
use tauri::{AppHandle, Manager, Emitter};
use log::{info, warn, error};

/// 数据库监控器
pub struct DatabaseMonitor {
    app_handle: AppHandle,
    last_data: Arc<Mutex<Option<Value>>>,
    is_running: Arc<Mutex<bool>>,
}

impl DatabaseMonitor {
    /// 创建新的数据库监控器
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            last_data: Arc::new(Mutex::new(None)),
            is_running: Arc::new(Mutex::new(false)),
        }
    }

    /// 启动数据库监控
    pub async fn start_monitoring(&self) -> Result<(), Box<dyn std::error::Error>> {
        info!("🔧 启动数据库自动监控");

        let last_data = self.last_data.clone();
        let is_running = self.is_running.clone();
        let app_handle = self.app_handle.clone();

        // 标记监控为运行状态
        *is_running.lock().await = true;

        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(5));

            loop {
                interval.tick().await;

                // 检查监控是否还在运行
                let running = is_running.lock().await;
                if !*running {
                    info!("⏹️ 数据库监控已停止");
                    break;
                }
                drop(running);

                // 检查是否启用了监控设置
                let settings_manager = app_handle.state::<crate::app_settings::AppSettingsManager>();
                let settings = settings_manager.get_settings();

                if !settings.db_monitoring_enabled {
                    continue;
                }

                // 获取当前数据
                match Self::get_current_data().await {
                    Ok(current_data) => {
                        let mut last = last_data.lock().await;

                        // 检查是否有数据变化
                        if let Some(ref old_data) = *last {
                            if old_data != &current_data {
                                info!("📢 检测到数据库变化，推送事件到前端");

                                // 推送事件到前端
                                if let Err(e) = app_handle.emit("database-changed", ()) {
                                    error!("❌ 推送数据库变化事件失败: {}", e);
                                } else {
                                    info!("✅ 数据库变化事件推送成功");
                                }
                            }
                        }

                        *last = Some(current_data);
                    }
                    Err(e) => {
                        warn!("⚠️ 获取当前数据库数据失败: {}", e);
                    }
                }
            }
        });

        Ok(())
    }

    /// 停止数据库监控
    pub async fn stop_monitoring(&self) {
        info!("⏹️ 停止数据库自动监控");
        *self.is_running.lock().await = false;
    }

    /// 获取当前数据库数据（真实实现）
    async fn get_current_data() -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
        // 这里我们复用现有的获取当前用户信息的逻辑
        // 直接调用后端命令来获取数据

        // 检测数据库路径
        let db_path = if cfg!(windows) {
            dirs::home_dir()
                .unwrap_or_default()
                .join("AppData")
                .join("Roaming")
                .join("Antigravity")
                .join("User")
                .join("globalStorage")
                .join("state.vscdb")
        } else {
            dirs::config_dir()
                .unwrap_or_default()
                .join("Antigravity")
                .join("User")
                .join("globalStorage")
                .join("state.vscdb")
        };

        if !db_path.exists() {
            // 数据库不存在，返回空数据
            return Ok(serde_json::json!({
                "user": null,
                "timestamp": chrono::Utc::now().timestamp()
            }));
        }

        // 读取数据库
        let conn = rusqlite::Connection::open(&db_path)?;

        // 查询当前用户数据
        let mut stmt = conn.prepare(
            "SELECT value FROM ItemTable WHERE key = 'antigravity.profile'"
        )?;

        let user_data: Option<String> = stmt.query_row([], |row| row.get(0)).ok();

        // 解析用户数据
        let user_value = if let Some(data) = user_data {
            serde_json::from_str(&data).unwrap_or(Value::Null)
        } else {
            Value::Null
        };

        Ok(serde_json::json!({
            "user": user_value,
            "timestamp": chrono::Utc::now().timestamp()
        }))
    }
}

