import React from 'react';
import { Globe, Lock, Users } from 'lucide-react';
import type { SharedNote } from '../types';

interface ShareStatusProps {
  sharedNote: SharedNote;
  isCommunity?: boolean;
}

const ShareStatus: React.FC<ShareStatusProps> = ({ sharedNote, isCommunity = false }) => {
  const getStatusInfo = () => {
    if (isCommunity) {
      return {
        icon: Users,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        text: 'Community',
        description: 'Community members can view and contribute'
      };
    }
    
    if (sharedNote.shareType === 'public') {
      return {
        icon: Globe,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        text: 'Public',
        description: 'Anyone with the link can view'
      };
    }
    
    return {
      icon: Lock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      text: 'Private',
      description: 'Login required to view'
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
      <Icon className={`h-4 w-4 ${statusInfo.color}`} />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {statusInfo.text}
      </span>
    </div>
  );
};

export default ShareStatus;