import React, { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  BaseDialog,
  BaseDialogContent,
  BaseDialogHeader,
  BaseDialogFooter,
  BaseDialogTitle,
  BaseDialogDescription,
} from '@/components/base-ui/BaseDialog';
import { BaseButton } from '@/components/base-ui/BaseButton';

export interface BusinessConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

/**
 * Business Component: ConfirmDialog
 * 确认对话框业务组件
 * 直接组合 BaseUI 组件处理所有 UI，专注于业务逻辑
 */
const BusinessConfirmDialog: React.FC<BusinessConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  isLoading = false,
}) => {
  // 处理确认操作
  const handleConfirm = useCallback(() => {
    onConfirm();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  // 处理取消操作
  const handleCancel = useCallback(() => {
    onCancel();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  // 处理对话框关闭
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleCancel();
    } else {
      onOpenChange(open);
    }
  }, [onOpenChange, handleCancel]);

  // 按钮变体映射
  const confirmVariant = variant === 'destructive' ? 'destructive' : 'default';

  return (
    <BaseDialog open={isOpen} onOpenChange={handleOpenChange}>
      <BaseDialogContent>
        <BaseDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <BaseDialogTitle>{title}</BaseDialogTitle>
          </div>
          <BaseDialogDescription className="ml-13">
            {description}
          </BaseDialogDescription>
        </BaseDialogHeader>

        <BaseDialogFooter>
          <BaseButton
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </BaseButton>
          <BaseButton
            variant={confirmVariant}
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingText={variant === 'destructive' ? '删除中...' : '确认中...'}
          >
            {confirmText}
          </BaseButton>
        </BaseDialogFooter>
      </BaseDialogContent>
    </BaseDialog>
  );
};

export default BusinessConfirmDialog;
