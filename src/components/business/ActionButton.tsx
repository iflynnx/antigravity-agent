import React from 'react';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { BaseTooltip } from '@/components/base-ui/BaseTooltip';


export interface BusinessActionButtonProps {
  // BaseButton 的所有 props
  onClick: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  icon?: React.ReactNode;
  tooltip?: string;
  loadingText?: string;
  className?: string;
  isAnyLoading?: boolean;
}

/**
 * Business Component: ActionButton
 * 操作按钮业务组件
 * 直接使用 BaseButton + BaseTooltip，专注于业务逻辑处理
 */
const BusinessActionButton: React.FC<BusinessActionButtonProps> = ({
  onClick,
  children,
  isLoading = false,
  disabled = false,
  variant = 'default',
  size = 'default',
  icon,
  tooltip,
  loadingText,
  className = '',
  isAnyLoading = false,
}) => {
  // 计算最终的禁用状态
  const isDisabled = disabled || isLoading || isAnyLoading;

  // 业务逻辑：按钮变体映射
  const buttonVariant = variant === 'secondary' ? 'outline' : variant;

  const buttonContent = (
    <BaseButton
      onClick={onClick}
      variant={buttonVariant}
      size={size}
      isLoading={isLoading}
      loadingText={loadingText}
      leftIcon={icon}
      disabled={isDisabled}
      className={className}
    >
      {children}
    </BaseButton>
  );

  // 如果有 tooltip，使用 BaseTooltip 包装
  if (tooltip) {
    return (
      <BaseTooltip content={tooltip} side="top">
        {buttonContent}
      </BaseTooltip>
    );
  }

  return buttonContent;
};

export default BusinessActionButton;
