import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface BaseSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg' | 'xl';
  color?: 'default' | 'primary' | 'white';
}

/**
 * BaseUI: BaseSpinner
 * 基础加载动画组件
 */
const BaseSpinner = React.forwardRef<HTMLDivElement, BaseSpinnerProps>(
  (
    {
      className,
      size = 'default',
      color = 'default',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      default: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    };

    const colorClasses = {
      default: 'text-gray-600',
      primary: 'text-blue-600',
      white: 'text-white',
    };

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        {...props}
      >
        <Loader2
          className={cn(
            'animate-spin',
            sizeClasses[size],
            colorClasses[color]
          )}
        />
      </div>
    );
  }
);

BaseSpinner.displayName = 'BaseSpinner';

export { BaseSpinner };
