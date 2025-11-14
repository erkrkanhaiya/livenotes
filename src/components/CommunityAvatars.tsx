import React, { useState } from 'react';
import { Users } from 'lucide-react';
import type { CommunityMember } from '../types';

interface CommunityAvatarsProps {
  members: CommunityMember[];
  maxVisible?: number;
}

const CommunityAvatars: React.FC<CommunityAvatarsProps> = ({ 
  members, 
  maxVisible = 3 
}) => {
  const [showAllMembers, setShowAllMembers] = useState(false);

  if (!members || members.length === 0) {
    return null;
  }

  // Sort members by joinedAt date (most recent first)
  const sortedMembers = [...members].sort((a, b) => 
    new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
  );

  const visibleMembers = sortedMembers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, sortedMembers.length - maxVisible);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="relative">
      {/* Avatar circles */}
      <div className="flex items-center -space-x-2">
        {visibleMembers.map((member, index) => (
          <div
            key={member.id}
            className={`
              w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 
              flex items-center justify-center text-white text-xs font-medium
              ${getAvatarColor(member.displayName)}
              shadow-sm hover:scale-110 transition-transform cursor-pointer
            `}
            title={`${member.displayName} (${member.role})`}
            style={{ zIndex: maxVisible - index }}
          >
            {member.photoURL ? (
              <img
                src={member.photoURL}
                alt={member.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(member.displayName)
            )}
          </div>
        ))}

        {/* +N indicator for additional members */}
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAllMembers(true)}
            className="
              w-8 h-8 rounded-full border-2 border-white dark:border-gray-800
              bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium
              flex items-center justify-center shadow-sm
              hover:scale-110 transition-all cursor-pointer
            "
            title={`${hiddenCount} more member${hiddenCount !== 1 ? 's' : ''}`}
          >
            +{hiddenCount}
          </button>
        )}
      </div>

      {/* Members list modal */}
      {showAllMembers && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowAllMembers(false)}
          />
          
          {/* Members list */}
          <div className="absolute bottom-10 right-0 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Community Members ({members.length})</span>
              </h3>
              <button
                onClick={() => setShowAllMembers(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {/* Avatar */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      text-white text-sm font-medium ${getAvatarColor(member.displayName)}
                    `}
                  >
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(member.displayName)
                    )}
                  </div>

                  {/* Member info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.displayName}
                      </p>
                      {member.role === 'owner' && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommunityAvatars;