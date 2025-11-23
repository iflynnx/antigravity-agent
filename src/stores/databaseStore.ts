import { create } from 'zustand';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// 数据库变化事件数据接口
export interface DatabaseChangeEvent {
    timestamp: number;
    old_data?: any;
    new_data?: any;
}

// 数据库监听状态接口
interface DatabaseListenerState {
    // 监听状态
    isListening: boolean;
    isAutoRefreshEnabled: boolean;

    // 最后的更新信息
    lastUpdateTime: number | null;
    updateCount: number;

    // 错误状态
    lastError: string | null;

    // 监听器清理函数
    unlistenFn: UnlistenFn | null;

    // Actions
    setListening: (listening: boolean) => void;
    setAutoRefreshEnabled: (enabled: boolean) => void;
    updateLastUpdateTime: () => void;
    incrementUpdateCount: () => void;
    setLastError: (error: string | null) => void;
    setUnlistenFn: (unlistenFn: UnlistenFn | null) => void;

    // 清理函数
    cleanup: () => Promise<void>;
}

/**
 * 数据库监听状态管理 Store
 * 使用 Zustand 管理数据库自动监听和刷新的状态
 */
export const useDatabaseStore = create<DatabaseListenerState>((set, get) => ({
    // 初始状态
    isListening: false,
    isAutoRefreshEnabled: true,
    lastUpdateTime: null,
    updateCount: 0,
    lastError: null,
    unlistenFn: null,

    // Actions
    setListening: (listening: boolean) => {
        set({ isListening: listening });
        console.log(`📢 数据库监听状态: ${listening ? '已启动' : '已停止'}`);
    },

    setAutoRefreshEnabled: (enabled: boolean) => {
        set({ isAutoRefreshEnabled: enabled });
        console.log(`⚙️ 自动刷新设置: ${enabled ? '已启用' : '已禁用'}`);
    },

    updateLastUpdateTime: () => {
        const timestamp = Date.now();
        set({ lastUpdateTime: timestamp });
    },

    incrementUpdateCount: () => {
        const currentCount = get().updateCount;
        set({ updateCount: currentCount + 1 });
        console.log(`📈 数据库更新计数: ${currentCount + 1}`);
    },

    setLastError: (error: string | null) => {
        set({ lastError: error });
        if (error) {
            console.error('❌ 数据库监听错误:', error);
        }
    },

    setUnlistenFn: (unlistenFn: UnlistenFn | null) => {
        set({ unlistenFn });
    },

    // 清理资源
    cleanup: async () => {
        const { unlistenFn } = get();

        if (unlistenFn) {
            try {
                await unlistenFn();
                set({ unlistenFn: null, isListening: false });
                console.log('🧹 数据库监听器已清理');
            } catch (error) {
                console.error('⚠️ 清理数据库监听器失败:', error);
                set({ lastError: `清理失败: ${error}` });
            }
        }
    },
}));

/**
 * 获取数据库监听状态的选择器 hooks
 * 便于组件只订阅需要的状态
 */
export const useDatabaseListeningState = () => useDatabaseStore(state => state.isListening);
export const useDatabaseAutoRefreshEnabled = () => useDatabaseStore(state => state.isAutoRefreshEnabled);
export const useDatabaseLastUpdateTime = () => useDatabaseStore(state => state.lastUpdateTime);
export const useDatabaseUpdateCount = () => useDatabaseStore(state => state.updateCount);
export const useDatabaseLastError = () => useDatabaseStore(state => state.lastError);

/**
 * 获取数据库统计信息
 */
export const useDatabaseStats = () => {
    const lastUpdateTime = useDatabaseLastUpdateTime();
    const updateCount = useDatabaseUpdateCount();
    const isListening = useDatabaseListeningState();
    const isAutoRefreshEnabled = useDatabaseAutoRefreshEnabled();

    return {
        isListening,
        isAutoRefreshEnabled,
        updateCount,
        lastUpdateTime,
        lastUpdateFormatted: lastUpdateTime ? new Date(lastUpdateTime).toLocaleString() : '从未更新',
    };
};