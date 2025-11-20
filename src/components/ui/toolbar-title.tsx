import React from 'react';
import { Shield } from 'lucide-react';
import UpdateBadge from '../UpdateBadge';
import { SilentLogExport } from '../SilentLogExport';
import { UpdateState, DownloadProgress } from '../../services/updateService';

interface ToolbarTitleProps {
  className?: string;
  updateState?: UpdateState;
  downloadProgress?: DownloadProgress | null;
  onUpdateClick?: () => void;
}

const ToolbarTitle: React.FC<ToolbarTitleProps> = ({
  className = '',
  updateState = 'no-update',
  downloadProgress = null,
  onUpdateClick,
}) => {
  return (
    <SilentLogExport>
      <div className="relative inline-block">
        <h1 className={`toolbar-title text-2xl font-bold m-0 bg-gradient-to-r from-antigravity-blue to-purple-600 bg-clip-text text-transparent flex items-center gap-2 ${className}`}>
          Antigravity Agent
        </h1>

        {/* 更新徽章 */}
        <UpdateBadge
          state={updateState}
          progress={downloadProgress}
          onClick={onUpdateClick}
        />
      </div>
    </SilentLogExport>
  );
};

export default ToolbarTitle;