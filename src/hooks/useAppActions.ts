import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useDatabaseStore } from '../stores/databaseStore';

/**
 * 应用级操作 Hook
 * 提供全局应用操作，如刷新备份列表等
 */
export const useAppActions = (showStatus?: (message: string, isError?: boolean) => void) => {
  const { updateLastUpdateTime, incrementUpdateCount, setLastError } = useDatabaseStore();

  // 刷新备份列表 - 从 useBackupManagement 提取核心逻辑
  const refreshBackupList = useCallback(async (skipAutoBackup: boolean = false) => {
    try {
      console.log('🔄 开始刷新备份列表...', { skipAutoBackup });

      if (!skipAutoBackup) {
        // 自动备份当前账户逻辑
        console.log('📦 开始自动备份当前账户...');

        try {
          const result = await invoke<string>('backup_antigravity_current_account');
          console.log('✅ 自动备份完成:', result);
          showStatus?.(`自动备份完成: ${result}`, false);
        } catch (backupError) {
          const backupErrorMessage = backupError instanceof Error ? backupError.message : String(backupError);
          console.log('ℹ️ 未检测到已登录用户或备份失败:', backupErrorMessage);
          showStatus?.('未检测到已登录用户', false);
        }
      }

      // 获取最新备份列表
      console.log('📋 获取备份列表...');
      const backups = await invoke<string[]>('list_backups');
      console.log('✅ 备份列表获取完成:', backups);

      // 更新数据库监听状态
      updateLastUpdateTime();
      incrementUpdateCount();
      setLastError(null);

      return backups;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 刷新备份列表失败:', errorMessage);
      setLastError(`刷新失败: ${errorMessage}`);
      throw error;
    }
  }, [showStatus, updateLastUpdateTime, incrementUpdateCount, setLastError]);

  // 手动刷新（用户点击刷新按钮）
  const handleRefresh = useCallback(async () => {
    console.log('🔄 用户点击刷新按钮');
    try {
      await refreshBackupList(false); // 不跳过自动备份
      showStatus?.('刷新成功并已更新备份', false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showStatus?.(`刷新失败: ${errorMessage}`, true);
    }
  }, [refreshBackupList, showStatus]);

  // 获取当前用户信息
  const getCurrentUserInfo = useCallback(async () => {
    try {
      console.log('👤 获取当前用户信息...');
      const userInfo = await invoke('get_current_antigravity_info');
      return userInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 获取用户信息失败:', errorMessage);
      throw error;
    }
  }, []);

  // 清理缓存和重置状态
  const clearCache = useCallback(() => {
    console.log('🧹 清理应用缓存...');
    // 这里可以添加清理逻辑
  }, []);

  return {
    refreshBackupList,
    handleRefresh,
    getCurrentUserInfo,
    clearCache,
  };
};