import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Trash2 } from 'lucide-react';
import { maskBackupFilename } from '../../utils/username-masking';
import { BaseTooltip } from '@/components/base-ui/BaseTooltip';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { BaseSpinner } from '@/components/base-ui/BaseSpinner';
import BusinessConfirmDialog from './ConfirmDialog';
import BusinessActionButton from './ActionButton';

interface BusinessManageSectionProps {
  backups: string[];
  showStatus: (message: string, isError?: boolean) => void;
  onRefresh: (skipAutoBackup?: boolean) => Promise<void>;
  isInitialLoading?: boolean;
}

const BusinessManageSection: React.FC<BusinessManageSectionProps> = ({
  backups,
  showStatus,
  onRefresh,
  isInitialLoading = false
}) => {
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
            <BaseTooltip content="清空所有备份" side="bottom">
              <BusinessActionButton
                variant="destructive"
                size="sm"
                onClick={handleClearAllBackups}
                icon={<Trash2 className="h-3 w-3" />}
              >
                {''}
              </BusinessActionButton>
            </BaseTooltip>
          )}
        </div>
        <div className={backups.length === 0 ? "backup-list-empty" : "backup-list-vertical"}>
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-light-text-muted">
              <BaseSpinner size="lg" />
              <p className="mt-3">正在加载备份列表...</p>
            </div>
          ) : backups.length === 0 ? (
            <p className="text-light-text-muted">暂无用户</p>
          ) : (
            backups.map((backup, index) => (
              <div key={`${backup}-${index}`} className="backup-item-vertical">
                <BaseTooltip content={backup} side="bottom">
                  <span className="backup-name">
                    {maskBackupFilename(backup)}
                  </span>
                </BaseTooltip>
                <div className="flex gap-2">
                  <BaseTooltip content="切换到此用户并自动启动 Antigravity" side="bottom">
                    <BusinessActionButton
                      variant="default"
                      size="sm"
                      onClick={() => handleSwitchAccount(backup)}
                      disabled={switchingAccount === backup}
                      isLoading={switchingAccount === backup}
                      loadingText="切换中..."
                    >
                      切换
                    </BusinessActionButton>
                  </BaseTooltip>
                  <BaseButton
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBackup(backup)}
                    disabled={switchingAccount === backup}
                  >
                    删除
                  </BaseButton>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 清空所有备份确认对话框 */}
      <BusinessConfirmDialog
        isOpen={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        title="确认清空所有备份"
        description={`此操作将永久删除所有 ${backups.length} 个用户备份文件，且无法恢复。请确认您要继续此操作吗？`}
        onConfirm={confirmClearAllBackups}
        onCancel={() => setIsClearDialogOpen(false)}
        variant="destructive"
        isLoading={isClearing}
        confirmText="确认删除"
      />

      {/* 单个删除确认对话框 */}
      <BusinessConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="确认删除备份"
        description={`确定要删除备份 "${backupToDelete}" 吗？此操作无法撤销。`}
        onConfirm={confirmDeleteBackup}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="destructive"
        isLoading={isDeleting}
        confirmText="确认删除"
      />
    </>
  );
};

export default BusinessManageSection;
