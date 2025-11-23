import React, { useState, useCallback } from 'react';
import ManageSection from './ManageSection';
import StatusNotification from './StatusNotification';
import Toolbar from './Toolbar';
import { TooltipProvider } from './ui/tooltip';
import { useDevToolsShortcut } from '../hooks/useDevToolsShortcut';
import { usePasswordDialog } from '../hooks/use-password-dialog';
import { useBackupManagement } from '../hooks/use-backup-management';
import { useConfigManager } from '../hooks/use-config-manager';
import { useAntigravityProcess } from '../hooks/use-antigravity-process';
import SettingsDialog from './SettingsDialog';

interface Status {
    message: string;
    isError: boolean;
}

/**
 * 主应用组件
 * 包含所有主要功能和业务逻辑
 * 只在 Antigravity 路径检测成功后渲染
 */
export function MainApp() {
    // 全局状态
    const [status, setStatus] = useState<Status>({ message: '', isError: false });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // 启用开发者工具快捷键 (Shift+Ctrl+I)
    useDevToolsShortcut();

    // 状态提示函数
    const showStatus = useCallback((message: string, isError: boolean = false): void => {
        setStatus({ message, isError });
        setTimeout(() => {
            setStatus({ message: '', isError: false });
        }, 5000);
    }, []);

    // 密码对话框 Hook
    const {
        passwordDialog,
        showPasswordDialog,
        closePasswordDialog,
        handlePasswordDialogCancel
    } = usePasswordDialog(showStatus);

    // 备份管理 Hook
    const {
        backups,
        isRefreshing,
        isInitialLoading,
        refreshBackupList,
        handleRefresh
    } = useBackupManagement(showStatus);

    // 配置管理 Hook
    const {
        configLoadingState,
        hasUserData,
        isCheckingData,
        importConfig,
        exportConfig
    } = useConfigManager(
        showStatus,
        showPasswordDialog,
        closePasswordDialog,
        handleRefresh,
        isRefreshing
    );

    // Antigravity 进程管理 Hook
    const {
        isProcessLoading,
        backupAndRestartAntigravity
    } = useAntigravityProcess(showStatus, handleRefresh);

    // 合并 loading 状态
    const loadingState = {
        isProcessLoading,
        isImporting: configLoadingState.isImporting,
        isExporting: configLoadingState.isExporting
    };

    return (
        <TooltipProvider>
            <>
                <Toolbar
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    onImport={importConfig}
                    onExport={exportConfig}
                    hasUserData={hasUserData}
                    isCheckingData={isCheckingData}
                    onBackupAndRestart={backupAndRestartAntigravity}
                    loadingState={loadingState}
                    showStatus={showStatus}
                    passwordDialog={passwordDialog}
                    onPasswordDialogCancel={handlePasswordDialogCancel}
                    onSettingsClick={() => setIsSettingsOpen(true)}
                />

                <div className="container">
                    <ManageSection
                        backups={backups}
                        showStatus={showStatus}
                        onRefresh={refreshBackupList}
                        isInitialLoading={isInitialLoading}
                    />
                </div>

                <StatusNotification
                    status={status}
                />

                <SettingsDialog
                    isOpen={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                />
            </>
        </TooltipProvider>
    );
}
