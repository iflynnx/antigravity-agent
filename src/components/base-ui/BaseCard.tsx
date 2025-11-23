import React from 'react';
import { cn } from '@/lib/utils';

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface BaseCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface BaseCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface BaseCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * BaseUI: BaseCard
 * 基础卡片组件
 */
const BaseCard = React.forwardRef<HTMLDivElement, BaseCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-900',
        'shadow-sm',
        className
      )}
      {...props}
    />
  )
);

BaseCard.displayName = 'BaseCard';

const BaseCardHeader = React.forwardRef<HTMLDivElement, BaseCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);

BaseCardHeader.displayName = 'BaseCardHeader';

const BaseCardContent = React.forwardRef<HTMLDivElement, BaseCardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

BaseCardContent.displayName = 'BaseCardContent';

const BaseCardFooter = React.forwardRef<HTMLDivElement, BaseCardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);

BaseCardFooter.displayName = 'BaseCardFooter';

export { BaseCard, BaseCardHeader, BaseCardContent, BaseCardFooter };
