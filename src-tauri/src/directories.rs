/// 目录获取模块
/// 统一管理所有配置和数据目录路径
use std::fs;
use std::path::PathBuf;

/// 获取应用主配置目录
/// 所有配置、日志、数据都统一存放在用户主目录的 .antigravity-agent 下
#[cfg(windows)]
pub fn get_config_directory() -> PathBuf {
    let config_dir = dirs::home_dir()
        .expect("Home directory not found")
        .join(".antigravity-agent");

    // 确保目录存在
    if let Err(e) = fs::create_dir_all(&config_dir) {
        eprintln!("警告：无法创建配置目录 {}: {}", config_dir.display(), e);
    }

    config_dir
}

/// 获取应用主配置目录
#[cfg(not(windows))]
pub fn get_config_directory() -> PathBuf {
    let config_dir = dirs::home_dir()
        .expect("Home directory not found")
        .join(".antigravity-agent");

    // 确保目录存在
    if let Err(e) = fs::create_dir_all(&config_dir) {
        eprintln!("警告：无法创建配置目录 {}: {}", config_dir.display(), e);
    }

    config_dir
}

/// 获取日志目录路径
#[cfg(windows)]
pub fn get_log_directory() -> PathBuf {
    get_config_directory().join("logs")
}

/// 获取日志目录路径
#[cfg(not(windows))]
pub fn get_log_directory() -> PathBuf {
    get_config_directory().join("logs")
}

/// 获取账户备份目录
pub fn get_accounts_directory() -> PathBuf {
    let accounts_dir = get_config_directory().join("antigravity-accounts");

    // 确保目录存在
    if let Err(e) = fs::create_dir_all(&accounts_dir) {
        eprintln!("警告：无法创建账户目录 {}: {}", accounts_dir.display(), e);
    }

    accounts_dir
}

/// 获取应用设置文件路径
pub fn get_app_settings_file() -> PathBuf {
    get_config_directory().join("app_settings.json")
}

/// 获取窗口状态文件路径
pub fn get_window_state_file() -> PathBuf {
    get_config_directory().join("window_state.json")
}

/// 获取 Antigravity 路径配置文件路径
pub fn get_antigravity_path_file() -> PathBuf {
    get_config_directory().join("antigravity_path.json")
}
