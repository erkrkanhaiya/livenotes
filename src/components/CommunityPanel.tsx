import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SharingService from '../services/sharingService';
import CommunityPermissions from './CommunityPermissions';
import type { CommunityMember, CommunityNote } from '../types';

interface CommunityPanelProps {
  shareId: string;
  className?: string;
}

const CommunityPanel: React.FC<CommunityPanelProps> = ({ shareId, className = '' }) => {
  const { user } = useAuth();
  const [communityNote, setCommunityNote] = useState<CommunityNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCommunityData();
  }, [shareId]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const note = await SharingService.getCommunityNote(shareId);
      setCommunityNote(note);
    } catch (err) {
      console.error('Error loading community data:', err);
      setError('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user || !communityNote) return;

    try {
      setJoining(true);
      setError('');

      const newMember: CommunityMember = {
        id: user.id || user.email,
        email: user.email,
        displayName: user.displayName || user.email,
        photoURL: user.photoURL,
        joinedAt: new Date(),
        role: 'member'
      };

      await SharingService.joinCommunity(shareId, newMember);
      await loadCommunityData(); // Refresh data
    } catch (err) {
      console.error('Error joining community:', err);
      setError('Failed to join community');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !communityNote) return;

    try {
      setJoining(true);
      setError('');
      
      await SharingService.leaveCommunity(shareId, user.email);
      await loadCommunityData(); // Refresh data
    } catch (err) {
      console.error('Error leaving community:', err);
      setError('Failed to leave community');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-500">Loading community...</span>
      </div>
    );
  }

  if (!communityNote || !communityNote.isCommunity) {
    return null;
  }

  const isUserMember = user && communityNote.members.some(member => member.email === user.email);
  const userMember = communityNote.members.find(member => member.email === user?.email);

  return (
    <div className={`bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-600 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Community ({communityNote.memberCount})
          </h3>
        </div>

        {user && (
          <div>
            {isUserMember ? (
              <button
                onClick={handleLeaveCommunity}
                disabled={joining || userMember?.role === 'owner'}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserMinus className="h-3 w-3" />
                <span>{userMember?.role === 'owner' ? 'Owner' : 'Leave'}</span>
              </button>
            ) : (
              <button
                onClick={handleJoinCommunity}
                disabled={joining}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserPlus className="h-3 w-3" />
                <span>{joining ? 'Joining...' : 'Join'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {communityNote.members.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No members yet. Be the first to join!
          </p>
        ) : (
          communityNote.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={member.displayName}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {member.displayName}
                  </p>
                  {member.role === 'owner' && (
                    <div title="Owner">
                      <Crown className="h-3 w-3 text-yellow-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Community Permissions - Only for Owners */}
      {isUserMember && userMember?.role === 'owner' && (
        <CommunityPermissions
          members={communityNote.members}
          shareId={shareId}
          onPermissionUpdate={loadCommunityData}
          className="mt-4"
        />
      )}

      {/* Call to Action for Non-Members */}
      {!user && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            Join this community to collaborate on this note!
          </p>
          <button
            onClick={() => {
              const baseUrl = import.meta.env.VITE_WEB_APP_URL || window.location.origin;
              window.location.href = baseUrl;
            }}
            className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Sign In to Join
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityPanel;