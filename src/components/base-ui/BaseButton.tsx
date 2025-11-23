import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const buttonVariants = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
  destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
  outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
  secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
  link: 'bg-transparent underline-offset-4 hover:underline text-blue-600 dark:text-blue-400 p-0',
};

const buttonSizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-8',
  icon: 'h-10 w-10',
};

/**
 * BaseUI: BaseButton
 * 纯UI按钮组件，不包含业务逻辑
 * 支持加载状态、图标、多种样式变体
 */
const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center gap-2',
          'rounded-lg font-medium whitespace-nowrap',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',

          // 变体样式
          buttonVariants[variant],

          // 尺寸样式
          buttonSizes[size],

          // 加载状态
          isLoading && 'cursor-wait opacity-80',

          // 自定义类名
          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText || '处理中...'}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex items-center">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="flex items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

BaseButton.displayName = 'BaseButton';

export { BaseButton };
