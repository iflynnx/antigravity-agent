import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BusinessStatusNotificationProps {
  status: {
    message: string;
    isError: boolean;
  } | null;
}

/**
 * Business Component: StatusNotification
 * 状态通知业务组件
 * 直接使用原生 UI 元素，专注于业务逻辑和状态管理
 */
const BusinessStatusNotification: React.FC<BusinessStatusNotificationProps> = ({
  status,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // 如果没有状态，不渲染任何内容
  useEffect(() => {
    if (!status || !status.message) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);

    // 自动消失
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [status]);

  if (!status || !status.message || !isVisible) {
    return null;
  }

  // 状态类型映射
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const config = status.isError ? typeConfig.error : typeConfig.success;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed bottom-8 right-8 max-w-md z-50',
        'animate-in slide-in-from-bottom-2',
        config.bgColor,
        config.borderColor,
        'border rounded-lg p-4 shadow-lg',
        'transition-all duration-300'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <p className={cn('flex-1 text-sm font-medium', config.textColor)}>
          {status.message}
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className={cn(
            'flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            'transition-colors'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default BusinessStatusNotification;
