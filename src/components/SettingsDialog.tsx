import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, X } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { AntigravityPathService } from '../services/antigravity-path-service';

interface SettingsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onOpenChange }) => {
    const [dataPath, setDataPath] = useState<string>('');
    const [execPath, setExecPath] = useState<string>('');
    const [newDataPath, setNewDataPath] = useState<string>('');
    const [newExecPath, setNewExecPath] = useState<string>('');
    const [isDataPathValid, setIsDataPathValid] = useState(false);
    const [isExecPathValid, setIsExecPathValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            loadCurrentPaths();
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
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] z-50 max-h-[90vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white p-6 pb-4 flex items-center gap-3">
                        <Settings className="h-5 w-5 text-antigravity-blue" />
                        设置
                    </Dialog.Title>

                    {isLoading ? (
                        <div className="text-center py-8 text-gray-600 dark:text-gray-400">加载中...</div>
                    ) : (
                        <div className="px-6 pb-6">
                            {/* 数据库路径 */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    数据库路径
                                </h3>
                                <div className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-2 break-all text-gray-700 dark:text-gray-300">
                                    {dataPath}
                                </div>
                                <button
                                    onClick={handleBrowseDataPath}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 font-medium w-full"
                                >
                                    修改数据库路径
                                </button>
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

                            {/* 可执行文件路径 */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    可执行文件路径
                                </h3>
                                <div className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-2 break-all text-gray-700 dark:text-gray-300">
                                    {execPath}
                                </div>
                                <button
                                    onClick={handleBrowseExecPath}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 font-medium w-full"
                                >
                                    修改可执行文件路径
                                </button>
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
                                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{message}</p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleClose}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
                                >
                                    关闭
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || isSaving}
                                    className="flex-1 px-4 py-3 bg-antigravity-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                >
                                    {isSaving ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </div>
                    )}

                    <Dialog.Close asChild>
                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                            aria-label="关闭"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default SettingsDialog;
