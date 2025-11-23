import React from 'react';
import * as Switch from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface BaseSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

/**
 * BaseUI: BaseSwitch
 * 基础开关组件，基于 Radix UI Switch 封装
 * 支持标签和描述文字
 */
const BaseSwitch = React.forwardRef<HTMLButtonElement, BaseSwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled = false,
      label,
      description,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Switch.Root
          ref={ref}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={cn(
            'w-11 h-6 rounded-full relative',
            'bg-gray-200 dark:bg-gray-700',
            'data-[state=checked]:bg-blue-600',
            'transition-all duration-200 ease-out',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'cursor-pointer'
          )}
          {...props}
        >
          <Switch.Thumb
            className={cn(
              'block w-5 h-5 bg-white rounded-full',
              'transform transition-transform duration-200 ease-out',
              'translate-x-0.5',
              'data-[state=checked]:translate-x-[22px]',
              'shadow-sm'
            )}
          />
        </Switch.Root>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

BaseSwitch.displayName = 'BaseSwitch';

export { BaseSwitch };
