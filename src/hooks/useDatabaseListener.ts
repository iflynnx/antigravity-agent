import { useEffect, useCallback, useState } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useDatabaseStore } from '../stores/databaseStore';
import { useAppActions } from './useAppActions';

/**
 * 数据库监听 Hook
 * 自动监听后端推送的数据库变化事件，并触发相应的界面更新
 */
export const useDatabaseListener = () => {
  const {
    setListening,
    setLastError,
    updateLastUpdateTime,
    incrementUpdateCount,
    setUnlistenFn,
    cleanup,
  } = useDatabaseStore();

  const { refreshBackupList } = useAppActions();

  // 处理数据库变化事件
  const handleDatabaseChange = useCallback(async (...args) => {
    try {
      console.log('📡 接收到数据库变化事件', args);


      console.log('✅ 数据库变化处理完成');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 处理数据库变化失败:', errorMessage);
      setLastError(`更新失败: ${errorMessage}`);
    }
  }, [refreshBackupList, updateLastUpdateTime, incrementUpdateCount, setLastError]);

  // 启动数据库监听
  const startListening = useCallback(async () => {
    try {
      console.log('🎧 启动数据库监听...');

      // 清理之前的监听器
      await cleanup();

      // 监听后端推送的数据库变化事件
      const unlistenFn = await listen('database-changed', handleDatabaseChange);

      setUnlistenFn(unlistenFn);
      setListening(true);

      console.log('✅ 数据库监听已启动');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 启动数据库监听失败:', errorMessage);
      setLastError(`启动失败: ${errorMessage}`);
      setListening(false);
    }
  }, [handleDatabaseChange, setListening, setLastError, setUnlistenFn, cleanup]);

  // 停止数据库监听
  const stopListening = useCallback(async () => {
    try {
      console.log('⏹️ 停止数据库监听...');

      await cleanup();
      setListening(false);

      console.log('✅ 数据库监听已停止');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 停止数据库监听失败:', errorMessage);
      setLastError(`停止失败: ${errorMessage}`);
    }
  }, [cleanup, setListening, setLastError]);

  // 重启监听（当设置改变时）
  const restartListening = useCallback(async () => {
    await stopListening();
    await startListening();
  }, [stopListening, startListening]);

  return {
    startListening,
    stopListening,
    restartListening,
    isListening: useDatabaseStore(state => state.isListening),
    lastError: useDatabaseStore(state => state.lastError),
  };
};

/**
 * 自动数据库监听 Hook
 * 根据设置自动启动/停止数据库监听，并处理组件生命周期
 */
export const useAutoDatabaseListener = () => {
  const { startListening, stopListening } = useDatabaseListener();
  const isAutoRefreshEnabled = useDatabaseStore(state => state.isAutoRefreshEnabled);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 根据设置自动启动或停止监听
    const manageListening = async () => {
      if (!isInitialized) {
        // 首次初始化时，先启动后端监控
        console.log('🔧 初始化数据库监控...');
        try {
          // 启动后端监控
          await invoke('start_database_monitoring');
          console.log('✅ 后端数据库监控已启动');
        } catch (error) {
          console.warn('⚠️ 启动后端监控失败:', error);
        }
        setIsInitialized(true);
      }

      if (isAutoRefreshEnabled) {
        await startListening();
        console.log('✅ 前端数据库监听已启动');
      } else {
        await stopListening();
        console.log('ℹ️ 前端数据库监听已停止');
      }
    };

    manageListening();

    // 组件卸载时清理
    return () => {
      stopListening();
    };
  }, [isAutoRefreshEnabled, startListening, stopListening, isInitialized]);

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📴 页面隐藏，暂停数据库监听');
      } else {
        console.log('📱 页面显示，恢复数据库监听');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};