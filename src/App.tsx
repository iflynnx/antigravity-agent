import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { exit } from '@tauri-apps/plugin-process';
import type { ListBackupsResult } from './types/tauri';
import ManageSection from './components/ManageSection';
import StatusNotification from './components/StatusNotification';
import Toolbar from './components/Toolbar';
import AntigravityPathDialog from './components/AntigravityPathDialog';
import { TooltipProvider } from './components/ui/tooltip';
import { useDevToolsShortcut } from './hooks/useDevToolsShortcut';
import { AntigravityPathService } from './services/antigravity-path-service';
import SettingsDialog from './components/SettingsDialog'; // 新增

interface Status {
  message: string;
  isError: boolean;
}

function App() {
  const [backups, setBackups] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ message: '', isError: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPathDialogOpen, setIsPathDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);  // 新增
  const [antigravityFound, setAntigravityFound] = useState<boolean | null>(null);

  // 启用开发者工具快捷键 (Shift+Ctrl+I)
  useDevToolsShortcut();

  const showStatus = (message: string, isError: boolean = false): void => {
    setStatus({ message, isError });
    setTimeout(() => {
      setStatus({ message: '', isError: false });
    }, 5000);
  };

  const refreshBackupList = async (skipAutoBackup: boolean = false): Promise<void> => {
    console.log('🔄 [刷新] 开始刷新备份列表, skipAutoBackup:', skipAutoBackup);
    try {
      // 1. 首先获取当前的备份列表
      let existingBackups: string[] = [];
      try {
        existingBackups = await invoke<ListBackupsResult>('list_backups');
      } catch (error) {
        console.log('获取现有备份列表失败:', error);
      }

      // 2. 尝试获取Antigravity当前运行时的用户信息并进行智能备份
      // 如果 skipAutoBackup 为 true，则跳过此步骤
      let autoBackedUp = false;
      if (!skipAutoBackup) {
        console.log('📦 [刷新] 尝试自动备份当前账户');
        try {
          // 注意：智能备份可以在进程运行时进行（只读数据库）
          const currentInfo = await invoke('get_current_antigravity_info');
          console.log('当前Antigravity用户信息:', currentInfo);

          // 检查是否有有效的用户信息（通过API Key或用户状态判断）
          if (currentInfo && ((currentInfo as any).apiKey || (currentInfo as any).userStatusProtoBinaryBase64)) {
            // 从认证信息中提取邮箱
            const userEmail = (currentInfo as any).email;

            console.log('提取的邮箱:', userEmail);

            try {
              // 直接传递邮箱给后端，让后端处理去重逻辑和文件名生成
              const result = await invoke('backup_antigravity_current_account', {
                email: userEmail  // 参数名必须匹配后端函数参数名
              });
              console.log('智能备份成功:', result);

              showStatus(`已自动备份当前用户: ${userEmail}`, false);
              autoBackedUp = true;
            } catch (backupError) {
              console.error('自动备份失败:', backupError);
              showStatus(`自动备份失败: ${backupError}`, true);
            }
          } else {
            console.log('未检测到有效的用户信息');
          }
        } catch (antigravityError) {
          console.log('无法获取Antigravity当前用户信息:', antigravityError);
          // 改为信息提示而非错误提示，因为"未登录"是正常状态
          showStatus('未检测到已登录的用户', false);
        }
      }

      // 3. 获取更新后的备份文件列表，添加延迟确保文件写入完成
      await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms确保文件写入完成
      const backupList = await invoke<ListBackupsResult>('list_backups');
      setBackups(backupList);

      if (autoBackedUp) {
        showStatus('刷新成功并已更新备份', false);
      } else if (!skipAutoBackup) {
        // 如果没有备份成功，说明当前没有登录用户，这是正常状态
        // showStatus('刷新成功', false);  // 不再显示，避免覆盖上面的"未检测到已登录的用户"提示
      } else {
        showStatus('刷新成功', false);
      }
    } catch (error) {
      console.error('❌ [刷新] 获取备份列表失败:', error);
      showStatus(`获取备份列表失败: ${error}`, true);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    console.log('🔘 [按钮] 点击刷新按钮');
    setIsRefreshing(true);
    try {
      // 正确：刷新按钮应该触发智能备份，然后刷新列表
      await refreshBackupList(false);
      console.log('✅ [按钮] 刷新完成');
    } catch (error) {
      console.error('❌ [按钮] 刷新失败:', error);
      showStatus(`刷新失败: ${error}`, true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePathSelected = () => {
    setIsPathDialogOpen(false);
    setAntigravityFound(true);
    // 路径设置完成后加载备份列表
    refreshBackupList(true).catch(console.error);
  };

  const handlePathDialogCancel = async () => {
    // 用户取消选择路径，退出应用
    try {
      await exit(0);
    } catch (error) {
      console.error('退出应用失败:', error);
    }
  };

  useEffect(() => {
    // 应用启动时检测 Antigravity 路径
    const detectAndInit = async () => {
      try {
        console.log('🔍 检测 Antigravity 安装路径...');

        // 检测数据库路径
        const pathInfo = await AntigravityPathService.detectAntigravityPath();

        // 检测可执行文件路径
        const execInfo = await AntigravityPathService.detectExecutable();

        if (pathInfo.found) {
          console.log('✅ Antigravity 数据库路径检测成功:', pathInfo.path);
          setAntigravityFound(true);

          // 可执行文件未找到时发出警告，但不阻止使用
          if (!execInfo.found) {
            console.warn('⚠️ 未检测到 Antigravity 可执行文件，启动功能可能不可用');
          } else {
            console.log('✅ Antigravity 可执行文件检测成功:', execInfo.path);
          }

          // 加载备份列表
          const backupList = await invoke<ListBackupsResult>('list_backups');
          setBackups(backupList);
        } else {
          console.log('⚠️ 未找到 Antigravity 数据库，显示路径选择对话框');
          setAntigravityFound(false);
          setIsPathDialogOpen(true);
        }
      } catch (error) {
        console.error('启动检测失败:', error);
        // 检测失败时也显示路径选择对话框
        setAntigravityFound(false);
        setIsPathDialogOpen(true);
      }
    };

    detectAndInit();
  }, []);

  return (
    <TooltipProvider>
      <style>{`
        .DialogOverlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 50;
        }

        .DialogContent {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background-color: rgb(17, 24, 39);
          color: white;
          border-radius: 0.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 1.5rem;
          width: 100%;
          max-width: 28rem;
          z-index: 50;
        }

        .DialogTitle {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .DialogDescription {
          color: rgb(209, 213, 219);
          margin-bottom: 1rem;
        }

        .Button {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }

        .Button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .Button--secondary {
          background-color: transparent;
          color: rgb(209, 213, 219);
          border: 1px solid rgb(75, 85, 99);
        }

        .Button--secondary:hover:not(:disabled) {
          background-color: rgb(75, 85, 99);
          color: white;
        }

        .Button--danger {
          background-color: rgb(220, 38, 38);
          color: white;
        }

        .Button--danger:hover:not(:disabled) {
          background-color: rgb(185, 28, 28);
        }
      `}</style>

      <div>
        {!isPathDialogOpen && (
          <>
            <Toolbar
              onRefresh={refreshBackupList}
              isRefreshing={isRefreshing}
              showStatus={showStatus}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />

            <div className="container">
              <ManageSection
                backups={backups}
                showStatus={showStatus}
                onRefresh={refreshBackupList}
              />
            </div>

            <StatusNotification
              status={status}
            />
          </>
        )}

        {/* 路径选择对话框 */}
        <AntigravityPathDialog
          isOpen={isPathDialogOpen}
          onPathSelected={handlePathSelected}
          onCancel={handlePathDialogCancel}
        />

        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;