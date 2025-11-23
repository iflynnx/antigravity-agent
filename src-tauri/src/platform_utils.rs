use std::path::PathBuf;

/// 获取Antigravity应用数据目录（跨平台）
pub fn get_antigravity_data_dir() -> Option<PathBuf> {
    log::info!("🔍 开始自动检测 Antigravity 数据目录...");
    
    let result = match std::env::consts::OS {
        "windows" => {
            // Windows: %APPDATA%\Antigravity\User\globalStorage\
            dirs::config_dir()
                .map(|path| path.join("Antigravity").join("User").join("globalStorage"))
        }
        "macos" => {
            // macOS: 基于 product.json 中的 dataFolderName: ".antigravity" 配置
            // ~/Library/Application Support/Antigravity/User/globalStorage/
            dirs::data_dir().map(|path| path.join("Antigravity").join("User").join("globalStorage"))
        }
        "linux" => {
            // Linux: 基于 product.json 中的 dataFolderName: ".antigravity" 配置
            // 优先使用 ~/.config/Antigravity/User/globalStorage/，备用 ~/.local/share/Antigravity/User/globalStorage/
            dirs::config_dir() // 优先：~/.config
                .map(|path| path.join("Antigravity").join("User").join("globalStorage"))
                .or_else(|| {
                    // 备用：~/.local/share
                    dirs::data_dir()
                        .map(|path| path.join("Antigravity").join("User").join("globalStorage"))
                })
        }
        _ => {
            // 其他系统：尝试使用数据目录
            dirs::data_dir().map(|path| path.join("Antigravity").join("User").join("globalStorage"))
        }
    };
    
    if let Some(ref path) = result {
        log::info!("✅ 找到 Antigravity 数据目录: {}", path.display());
    } else {
        log::warn!("⚠️ 未能自动检测到 Antigravity 数据目录");
    }
    
    result
}

/// 获取Antigravity状态数据库文件路径
/// 优先使用用户自定义路径，其次使用自动检测的路径
pub fn get_antigravity_db_path() -> Option<PathBuf> {
    // 1. 尝试从配置文件读取用户自定义路径
    if let Ok(Some(custom_path)) = crate::antigravity_path_config::get_custom_data_path() {
        let db_path = PathBuf::from(&custom_path).join("state.vscdb");
        if db_path.exists() && db_path.is_file() {
            log::info!("📍 使用自定义 Antigravity 数据路径: {}", custom_path);
            return Some(db_path);
        } else {
            log::warn!("⚠️ 自定义数据路径无效，回退到自动检测: {}", custom_path);
        }
    }
    
    // 2. 回退到自动检测路径
    get_antigravity_data_dir().map(|dir| dir.join("state.vscdb"))
}


/// 检查Antigravity是否安装并运行
pub fn is_antigravity_available() -> bool {
    get_antigravity_db_path()
        .map(|path| path.exists())
        .unwrap_or(false)
}

/// 搜索可能的Antigravity安装位置
pub fn find_antigravity_installations() -> Vec<PathBuf> {
    let mut possible_paths = Vec::new();

    // 用户数据目录
    if let Some(user_data) = dirs::data_dir() {
        possible_paths.push(user_data.join("Antigravity"));
    }

    // 配置目录
    if let Some(config_dir) = dirs::config_dir() {
        possible_paths.push(config_dir.join("Antigravity"));
    }

    possible_paths
}

/// 获取所有可能的Antigravity数据库路径
pub fn get_all_antigravity_db_paths() -> Vec<PathBuf> {
    let mut db_paths = Vec::new();

    // 主要路径
    if let Some(main_path) = get_antigravity_db_path() {
        db_paths.push(main_path);
    }

    // 搜索其他可能的位置
    for install_dir in find_antigravity_installations() {
        if install_dir.exists() {
            // 递归搜索state.vscdb文件
            if let Ok(entries) = std::fs::read_dir(&install_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() && path.file_name().is_some_and(|name| name == "state.vscdb")
                    {
                        db_paths.push(path);
                    }
                }
            }
        }
    }

    db_paths
}

/// 关闭Antigravity进程 - 使用sysinfo库实现跨平台统一处理
pub fn kill_antigravity_processes() -> Result<String, String> {
    log::info!("🔍 开始搜索并关闭 Antigravity 进程");

    // 使用sysinfo库获取所有进程
    let mut system = sysinfo::System::new_all();
    system.refresh_all();

    let mut killed_processes = Vec::new();

    // 遍历所有进程，查找名为 "Antigravity" 的进程
    for (pid, process) in system.processes() {
        let process_name = process.name();

        // 精确匹配进程名 "Antigravity" (区分大小写)
        if process_name == "Antigravity" {
            log::info!("🎯 找到目标进程: {} (PID: {})", process_name, pid);

            // 尝试终止进程
            if process.kill() {
                killed_processes.push(format!("Antigravity (PID: {})", pid));
                log::info!("✅ 成功终止进程: {}", pid);
            } else {
                log::warn!("⚠️ 终止进程失败: {}", pid);
            }
        }
    }

    if killed_processes.is_empty() {
        log::info!("ℹ️ 未找到名为 'Antigravity' 的运行进程");
        Err("未找到Antigravity进程".to_string())
    } else {
        let success_msg = format!("已成功关闭Antigravity进程: {}", killed_processes.join(", "));
        log::info!("🎉 {}", success_msg);
        Ok(success_msg)
    }
}

/// 检查 Antigravity 进程是否正在运行（使用 sysinfo）
pub fn is_antigravity_running() -> bool {
    log::info!("🔍 检查 Antigravity 进程是否运行");

    let mut system = sysinfo::System::new_all();
    system.refresh_all();

    for (pid, process) in system.processes() {
        if process.name() == "Antigravity" {
            log::info!("✅ 发现运行中的 Antigravity 进程 (PID: {})", pid);
            return true;
        }
    }

    log::info!("ℹ️ 未发现运行中的 Antigravity 进程");
    false
}
