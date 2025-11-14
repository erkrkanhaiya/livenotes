import React, { useState } from 'react';
import { Settings, Users, Lock, Edit3, Plus } from 'lucide-react';
import type { CommunityMember } from '../types';

interface CommunityPermissionsProps {
  members: CommunityMember[];
  shareId: string;
  onPermissionUpdate: (shareId: string) => void;
  className?: string;
}

export interface CommunityPermissions {
  allowMembersToEdit: boolean;
  allowMembersToAddNotes: boolean;
  allowMembersToInvite: boolean;
  requireApprovalToJoin: boolean;
}

const CommunityPermissions: React.FC<CommunityPermissionsProps> = ({
  members,
  shareId,
  onPermissionUpdate,
  className = ''
}) => {
  const [permissions, setPermissions] = useState<CommunityPermissions>({
    allowMembersToEdit: true,
    allowMembersToAddNotes: true,
    allowMembersToInvite: false,
    requireApprovalToJoin: false,
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const updatePermission = async (key: keyof CommunityPermissions, value: boolean) => {
    try {
      setSaving(true);
      const updatedPermissions = { ...permissions, [key]: value };
      setPermissions(updatedPermissions);
      
      // TODO: Save to Firebase/backend
      // await SharingService.updateCommunityPermissions(shareId, updatedPermissions);
      
      onPermissionUpdate(shareId);
      console.log('🔐 Community permissions updated:', updatedPermissions);
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const ownerCount = members.filter(m => m.role === 'owner').length;
  const memberCount = members.filter(m => m.role === 'member').length;

  return (
    <div className={`bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-600 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Community Settings
          </h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Members</span>
          </div>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
            {memberCount + ownerCount}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Security</span>
          </div>
          <p className="text-lg font-bold text-green-700 dark:text-green-400">
            {permissions.requireApprovalToJoin ? 'Private' : 'Open'}
          </p>
        </div>
      </div>

      {/* Permission Settings */}
      {showSettings && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-600 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Community Permissions
          </h4>

          {/* Allow Members to Edit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Edit3 className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Allow members to edit notes
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Members can modify existing community notes
                </p>
              </div>
            </div>
            <button
              onClick={() => updatePermission('allowMembersToEdit', !permissions.allowMembersToEdit)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                permissions.allowMembersToEdit ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  permissions.allowMembersToEdit ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Allow Members to Add Notes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plus className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Allow members to add notes
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Members can create new notes in this community
                </p>
              </div>
            </div>
            <button
              onClick={() => updatePermission('allowMembersToAddNotes', !permissions.allowMembersToAddNotes)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                permissions.allowMembersToAddNotes ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  permissions.allowMembersToAddNotes ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Allow Members to Invite */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Allow members to invite others
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Members can share community links with others
                </p>
              </div>
            </div>
            <button
              onClick={() => updatePermission('allowMembersToInvite', !permissions.allowMembersToInvite)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                permissions.allowMembersToInvite ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  permissions.allowMembersToInvite ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Require Approval to Join */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Require approval to join
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  New members need owner approval before joining
                </p>
              </div>
            </div>
            <button
              onClick={() => updatePermission('requireApprovalToJoin', !permissions.requireApprovalToJoin)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                permissions.requireApprovalToJoin ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  permissions.requireApprovalToJoin ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {saving && (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-gray-500">Saving permissions...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPermissions;