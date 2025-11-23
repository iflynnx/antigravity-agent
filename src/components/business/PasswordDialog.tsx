import React, { useState, useCallback } from 'react';
import { KeyRound } from 'lucide-react';
import {
  BaseDialog,
  BaseDialogContent,
  BaseDialogHeader,
  BaseDialogFooter,
  BaseDialogTitle,
  BaseDialogDescription,
} from '@/components/base-ui/BaseDialog';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { BasePasswordInput } from '@/components/base-ui/BaseInput';

export interface BusinessPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  requireConfirmation?: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  submitButtonText?: string;
  validatePassword?: (password: string) => { isValid: boolean; message?: string };
}

/**
 * Business Component: PasswordDialog
 * 密码输入业务组件
 * 直接组合 BaseUI 组件处理所有 UI，专注于业务逻辑
 */
const BusinessPasswordDialog: React.FC<BusinessPasswordDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  requireConfirmation = false,
  onSubmit,
  onCancel,
  submitButtonText = '确认',
  validatePassword,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');

  // 处理密码提交
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 基本验证
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    // 自定义验证
    if (validatePassword) {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        setError(validation.message || '密码无效');
        return;
      }
    }

    // 确认密码验证
    if (requireConfirmation && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 业务逻辑：提交密码
    onSubmit(password);
  }, [password, confirmPassword, requireConfirmation, onSubmit, validatePassword]);

  // 处理取消操作
  const handleCancel = useCallback(() => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    onCancel();
  }, [onCancel]);

  // 处理对话框关闭
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleCancel();
    } else {
      onOpenChange(open);
    }
  }, [onOpenChange, handleCancel]);

  // 计算表单是否有效
  const isValid = password.trim() !== '' &&
    (!validatePassword || validatePassword(password).isValid) &&
    (!requireConfirmation || password === confirmPassword);

  return (
    <BaseDialog open={isOpen} onOpenChange={handleOpenChange}>
      <BaseDialogContent>
        <BaseDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <BaseDialogTitle>{title}</BaseDialogTitle>
          </div>
          {description && (
            <BaseDialogDescription className="ml-13">
              {description}
            </BaseDialogDescription>
          )}
        </BaseDialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <BasePasswordInput
            label="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            autoFocus
          />

          {requireConfirmation && (
            <BasePasswordInput
              label="确认密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={requireConfirmation && password !== confirmPassword ? '两次输入的密码不一致' : undefined}
            />
          )}

          <BaseDialogFooter>
            <BaseButton
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              取消
            </BaseButton>
            <BaseButton
              type="submit"
              disabled={!isValid}
            >
              {submitButtonText}
            </BaseButton>
          </BaseDialogFooter>
        </form>
      </BaseDialogContent>
    </BaseDialog>
  );
};

export default BusinessPasswordDialog;
