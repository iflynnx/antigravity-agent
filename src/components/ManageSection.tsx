import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import * as Dialog from '@radix-ui/react-dialog';
import { Trash2 } from 'lucide-react';
import { maskBackupFilename } from '../utils/username-masking';
import { StandardTooltip } from './ui/tooltip';

const ManageSection = ({ backups, showStatus, onRefresh, isInitialLoading = false }) => {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState<string | null>(null);

  const handleDeleteBackup = (backupName: string) => {
    setBackupToDelete(backupName);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBackup = async () => {
    if (!backupToDelete) return;

    setIsDeleting(true);
    try {
      await invoke('delete_backup', { name: backupToDelete });
      showStatus(`备份 "${backupToDelete}" 删除成功`);
      setDeleteDialogOpen(false);
      setBackupToDelete(null);

      // 删除成功后刷新列表，跳过自动备份（传递 true 参数）
      if (onRefresh) {
        await onRefresh(true);
      }
    } catch (error) {
      showStatus(`删除备份失败: ${error}`, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSwitchAccount = async (backupName: string) => {
    console.log('🔄 用户点击切换按钮，目标账户:', backupName);
    setSwitchingAccount(backupName);
    try {
      console.log('📞 调用后端 switch_to_antigravity_account 命令');
      const result = await invoke('switch_to_antigravity_account', {
        accountName: backupName
      });
      console.log('✅ 切换账户成功，结果:', result);
      showStatus(`已切换到用户: ${backupName}`);
    } catch (error) {
      console.error('❌ 切换用户失败:', error);
      showStatus(`切换用户失败: ${error}`, true);
    } finally {
      setSwitchingAccount(null);
      console.log('🔧 切换操作流程结束');
    }
  };

  const handleClearAllBackups = () => {
    if (backups.length === 0) {
      showStatus('当前没有用户备份可清空', true);
      return;
    }
    setIsClearDialogOpen(true);
  };

  const confirmClearAllBackups = async () => {
    setIsClearing(true);
    try {
      const result = await invoke<string>('clear_all_backups');
      showStatus(result as string);
      setIsClearDialogOpen(false);

      // 清空成功后刷新列表，跳过自动备份（传递 true 参数）
      if (onRefresh) {
        await onRefresh(true);
      }
    } catch (error) {
      showStatus(`清空备份失败: ${error}`, true);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <section className="card section-span-full mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2>用户管理</h2>
          {backups.length > 0 && (
            <button
              className="btn btn-danger px-2 py-1 text-xs"
              onClick={handleClearAllBackups}
              title="清空所有备份"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className={backups.length === 0 ? "backup-list-empty" : "backup-list-vertical"}>
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-light-text-muted">
              <div className="animate-spin h-8 w-8 border-3 border-gray-400 border-t-transparent rounded-full mb-3"></div>
              <p>正在加载备份列表...</p>
            </div>
          ) : backups.length === 0 ? (
            <p className="text-light-text-muted">暂无用户</p>
          ) : (
            backups.map((backup, index) => (
              <div key={`${backup}-${index}`} className="backup-item-vertical">
                <StandardTooltip content={backup} side="bottom">
                  <span className="backup-name">
                    {maskBackupFilename(backup)}
                  </span>
                </StandardTooltip>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary px-2 py-1 text-xs"
                    onClick={() => handleSwitchAccount(backup)}
                    disabled={switchingAccount === backup}
                    title="切换到此用户并自动启动 Antigravity"
                  >
                    {switchingAccount === backup ? '切换中...' : '切换'}
                  </button>
                  <button
                    className="btn btn-danger px-2 py-1 text-xs"
                    onClick={() => handleDeleteBackup(backup)}
                    disabled={switchingAccount === backup}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Radix UI 确认对话框 - 清空所有 */}
      <Dialog.Root open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white p-6 pb-4">
              确认清空所有备份
            </Dialog.Title>

            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 px-6 pb-6">
              此操作将永久删除所有 {backups.length} 个用户备份文件，且无法恢复。
              请确认您要继续此操作吗？
            </Dialog.Description>

            <div className="flex gap-3 p-6 pt-0 justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 font-medium" disabled={isClearing}>
                  取消
                </button>
              </Dialog.Close>

              <button
                onClick={confirmClearAllBackups}
                disabled={isClearing}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {isClearing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 单个删除确认对话框 */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white p-6 pb-4">
              确认删除备份
            </Dialog.Title>

            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 px-6 pb-6">
              确定要删除备份 "{backupToDelete}" 吗？
              此操作无法撤销。
            </Dialog.Description>

            <div className="flex gap-3 p-6 pt-0 justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 font-medium" disabled={isDeleting}>
                  取消
                </button>
              </Dialog.Close>

              <button
                onClick={confirmDeleteBackup}
                disabled={isDeleting}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default ManageSection;