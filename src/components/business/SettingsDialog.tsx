import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { AntigravityPathService } from '../../services/antigravity-path-service';
import {
  BaseDialog,
  BaseDialogContent,
  BaseDialogHeader,
  BaseDialogTitle,
} from '@/components/base-ui/BaseDialog';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { BaseSpinner } from '@/components/base-ui/BaseSpinner';

interface BusinessSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BusinessSettingsDialog: React.FC<BusinessSettingsDialogProps> = ({
  isOpen,
  onOpenChange
}) => {
  const [dataPath, setDataPath] = useState<string>('');
  const [execPath, setExecPath] = useState<string>('');
  const [newDataPath, setNewDataPath] = useState<string>('');
  const [newExecPath, setNewExecPath] = useState<string>('');
  const [isDataPathValid, setIsDataPathValid] = useState(false);
  const [isExecPathValid, setIsExecPathValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>('');

  // 监控设置状态
  const [isDbMonitoringEnabled, setIsDbMonitoringEnabled] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentPaths();
      loadCurrentSettings();
    }
  }, [isOpen]);

  const loadCurrentPaths = async () => {
    setIsLoading(true);
    try {
      // 获取用户自定义路径
      const paths = await AntigravityPathService.getCurrentPaths();

      // 如果没有自定义路径，尝试获取自动检测的路径
      let finalDataPath = paths.dataPath;
      let finalExecPath = paths.executablePath;

      if (!finalDataPath) {
        const detectedData = await AntigravityPathService.detectAntigravityPath();
        if (detectedData.found && detectedData.path) {
          finalDataPath = detectedData.path + ' (自动检测)';
        }
      }

      if (!finalExecPath) {
        const detectedExec = await AntigravityPathService.detectExecutable();
        if (detectedExec.found && detectedExec.path) {
          finalExecPath = detectedExec.path + ' (自动检测)';
        }
      }

      setDataPath(finalDataPath || '未设置');
      setExecPath(finalExecPath || '未设置');
      setNewDataPath('');
      setNewExecPath('');
    } catch (error) {
      console.error('加载路径失败:', error);
      setDataPath('加载失败');
      setExecPath('加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSettings = async () => {
    setIsSettingsLoading(true);
    try {
      // 加载数据库监控状态
      const dbMonitoringEnabled = await invoke<boolean>('is_db_monitoring_enabled');
      setIsDbMonitoringEnabled(dbMonitoringEnabled);
    } catch (error) {
      console.error('加载设置失败:', error);
      // 使用默认值
      setIsDbMonitoringEnabled(true);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleDbMonitoringToggle = async (enabled: boolean) => {
    try {
      const result = await invoke<string>('save_db_monitoring_state', { enabled });
      setIsDbMonitoringEnabled(enabled);
      setMessage(`✅ ${result}`);
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage(`❌ 设置失败: ${error}`);
    }
  };

  const handleBrowseDataPath = async () => {
    try {
      const result = await open({
        directory: true,
        multiple: false,
        title: '选择 Antigravity 数据目录',
      });

      if (result && typeof result === 'string') {
        setNewDataPath(result);
        const valid = await AntigravityPathService.validatePath(result);
        setIsDataPathValid(valid);
        if (!valid) {
          setMessage('⚠️ 无效的数据目录：未找到 state.vscdb 文件');
        } else {
          setMessage('');
        }
      }
    } catch (error) {
      setMessage(`选择失败: ${error}`);
    }
  };

  const handleBrowseExecPath = async () => {
    try {
      const result = await open({
        directory: false,
        multiple: false,
        title: '选择 Antigravity 可执行文件',
        filters: [
          { name: '可执行文件', extensions: ['exe', 'app', ''] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (result && typeof result === 'string') {
        setNewExecPath(result);
        const valid = await AntigravityPathService.validateExecutable(result);
        setIsExecPathValid(valid);
        if (!valid) {
          setMessage('⚠️ 无效的可执行文件');
        } else {
          setMessage('');
        }
      }
    } catch (error) {
      setMessage(`选择失败: ${error}`);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      // 保存数据路径
      if (newDataPath && isDataPathValid) {
        await AntigravityPathService.savePath(newDataPath);
        setDataPath(newDataPath);
      }

      // 保存可执行文件路径
      if (newExecPath && isExecPathValid) {
        await AntigravityPathService.saveExecutable(newExecPath);
        setExecPath(newExecPath);
      }

      setMessage('✅ 设置已保存');
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      setMessage(`❌ 保存失败: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // 重置状态
    setNewDataPath('');
    setNewExecPath('');
    setMessage('');
    onOpenChange(false);
  };

  const hasChanges = (newDataPath && isDataPathValid) || (newExecPath && isExecPathValid);

  return (
    <BaseDialog open={isOpen} onOpenChange={onOpenChange}>
      <BaseDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <BaseDialogHeader>
          <BaseDialogTitle>
            <Settings className="h-5 w-5 text-antigravity-blue" />
            设置
          </BaseDialogTitle>
        </BaseDialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <BaseSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 数据库路径 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                数据库路径
              </h3>
              <div className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg break-all text-gray-700 dark:text-gray-300">
                {dataPath}
              </div>
              <BaseButton
                variant="outline"
                onClick={handleBrowseDataPath}
                disabled={isSaving}
                className="w-full"
              >
                修改数据库路径
              </BaseButton>
              {newDataPath && (
                <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">新路径：</div>
                  <div className="break-all text-gray-800 dark:text-gray-200">{newDataPath}</div>
                  {isDataPathValid && (
                    <div className="text-green-600 dark:text-green-400 mt-1">✅ 有效</div>
                  )}
                </div>
              )}
            </div>

            {/* 数据库监控设置 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                数据库监控
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      启用自动监控
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      实时监控 Antigravity 数据库变化，自动记录用户信息
                    </div>
                  </div>
                  <div className="relative">
                    {isSettingsLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
                    ) : (
                      <button
                        onClick={() => handleDbMonitoringToggle(!isDbMonitoringEnabled)}
                        disabled={isSettingsLoading}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-antigravity-blue focus:ring-offset-2 ${
                          isDbMonitoringEnabled ? 'bg-antigravity-blue' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isDbMonitoringEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {isDbMonitoringEnabled ? (
                    <span className="text-green-600 dark:text-green-400">🟢 监控已启用，将自动检测数据库变化</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">🔴 监控已禁用，需要手动刷新获取用户信息</span>
                  )}
                </div>
              </div>
            </div>

            {/* 可执行文件路径 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                可执行文件路径
              </h3>
              <div className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg break-all text-gray-700 dark:text-gray-300">
                {execPath}
              </div>
              <BaseButton
                variant="outline"
                onClick={handleBrowseExecPath}
                disabled={isSaving}
                className="w-full"
              >
                修改可执行文件路径
              </BaseButton>
              {newExecPath && (
                <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">新路径：</div>
                  <div className="break-all text-gray-800 dark:text-gray-200">{newExecPath}</div>
                  {isExecPathValid && (
                    <div className="text-green-600 dark:text-green-400 mt-1">✅ 有效</div>
                  )}
                </div>
              )}
            </div>

            {message && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-800 dark:text-gray-200">{message}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <BaseButton
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1"
              >
                关闭
              </BaseButton>
              <BaseButton
                variant="default"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                isLoading={isSaving}
                loadingText="保存中..."
                className="flex-1"
              >
                保存
              </BaseButton>
            </div>
          </div>
        )}
      </BaseDialogContent>
    </BaseDialog>
  );
};

export default BusinessSettingsDialog;
