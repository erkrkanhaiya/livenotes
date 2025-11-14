import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Users, Edit3, Plus, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../services/notificationService';

export interface CommunityNotification {
  id: string;
  type: 'note_added' | 'note_edited' | 'member_joined' | 'member_left';
  communityId: string;
  communityTitle: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionBy: {
    name: string;
    email: string;
  };
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http');

  // Load real notifications from Firestore
  useEffect(() => {
    if (!user || !user.email) return;

    // Subscribe to real-time notifications
    const unsubscribe = NotificationService.subscribeToNotifications(
      user.email,
      (notifications) => {
        setNotifications(notifications);
      }
    );

    // Also load initial notifications
    NotificationService.getNotifications(user.email)
      .then((notifications) => {
        setNotifications(notifications);
      })
      .catch((error) => {
        console.error('Error loading notifications:', error);
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        const bellButton = target.closest('button[title="Community Notifications"]');
        if (!bellButton) {
          setShowNotifications(false);
        }
      }
    };

    if (showNotifications) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.email) return;
    try {
      await NotificationService.markAllAsRead(user.email);
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const removeNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const getNotificationIcon = (type: CommunityNotification['type']) => {
    const iconSize = isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4';
    switch (type) {
      case 'note_added':
        return <Plus className={`${iconSize} text-green-500`} />;
      case 'note_edited':
        return <Edit3 className={`${iconSize} text-blue-500`} />;
      case 'member_joined':
        return <Users className={`${iconSize} text-purple-500`} />;
      case 'member_left':
        return <Users className={`${iconSize} text-red-500`} />;
      default:
        return <Bell className={`${iconSize} text-gray-500`} />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div className={`relative ${className} z-50`}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className={`relative ${isExtension ? 'p-1.5' : 'p-2'} text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors`}
        title="Community Notifications"
      >
        <Bell className={isExtension ? 'h-4 w-4' : 'h-5 w-5'} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white ${isExtension ? 'text-[10px] h-4 w-4' : 'text-xs h-5 w-5'} font-bold rounded-full flex items-center justify-center`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div 
          ref={notificationRef} 
          className={`
            ${isExtension ? 'fixed' : 'absolute'} 
            ${isExtension ? 'right-2' : 'right-0'} 
            ${isExtension ? 'top-12' : 'top-12'} 
            bg-white dark:bg-dark-card 
            border border-gray-200 dark:border-gray-600 
            rounded-lg shadow-xl 
            z-[100] 
            ${isExtension ? 'w-80 max-h-64' : 'w-96 max-h-96'} 
            overflow-hidden
            ${isExtension ? 'mt-1' : ''}
          `}
          style={isExtension ? {
            maxWidth: 'calc(100vw - 1rem)',
            maxHeight: 'calc(100vh - 4rem)'
          } : {}}
        >
          {/* Header */}
          <div className={`flex items-center justify-between ${isExtension ? 'p-2' : 'p-4'} border-b border-gray-200 dark:border-gray-600`}>
            <h3 className={`${isExtension ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-white text-left`}>
              Community Activity
            </h3>
            <div className={`flex items-center ${isExtension ? 'space-x-1' : 'space-x-2'}`}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`${isExtension ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors`}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className={`${isExtension ? 'p-0.5' : 'p-1'} hover:bg-gray-100 dark:hover:bg-gray-700 rounded`}
              >
                <X className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-gray-600 dark:text-gray-400`} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className={isExtension ? 'max-h-48 overflow-y-auto' : 'max-h-80 overflow-y-auto'}>
            {notifications.length === 0 ? (
              <div className={`${isExtension ? 'p-4' : 'p-6'} text-center text-gray-500 dark:text-gray-400`}>
                <Bell className={`${isExtension ? 'h-6 w-6' : 'h-8 w-8'} mx-auto mb-2 opacity-50`} />
                <p className={isExtension ? 'text-xs' : 'text-sm'}>No notifications yet</p>
                <p className={isExtension ? 'text-[10px]' : 'text-xs'}>Community activity will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${isExtension ? 'p-2' : 'p-4'} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className={`flex items-start ${isExtension ? 'space-x-2' : 'space-x-3'}`}>
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className={`${isExtension ? 'text-xs' : 'text-sm'} font-medium text-gray-900 dark:text-white truncate text-left`}>
                            {notification.communityTitle}
                          </p>
                          <div className={`flex items-center ${isExtension ? 'space-x-0.5' : 'space-x-1'}`}>
                            <span className={`${isExtension ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <div className={`${isExtension ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-blue-500 rounded-full`}></div>
                            )}
                          </div>
                        </div>
                        <p className={`${isExtension ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-300 ${isExtension ? 'mt-0.5' : 'mt-1'} text-left`}>
                          {notification.message}
                        </p>
                        <p className={`${isExtension ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400 ${isExtension ? 'mt-0.5' : 'mt-1'} text-left`}>
                          by {notification.actionBy.name}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className={`flex-shrink-0 flex items-center ${isExtension ? 'space-x-0.5' : 'space-x-1'}`}>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className={`${isExtension ? 'p-0.5' : 'p-1'} hover:bg-gray-200 dark:hover:bg-gray-600 rounded`}
                            title="Mark as read"
                          >
                            <Eye className={`${isExtension ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-gray-500`} />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className={`${isExtension ? 'p-0.5' : 'p-1'} hover:bg-gray-200 dark:hover:bg-gray-600 rounded`}
                          title="Remove notification"
                        >
                          <X className={`${isExtension ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-gray-500`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className={`${isExtension ? 'p-2' : 'p-3'} border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800`}>
              <button
                onClick={() => {
                  // TODO: Navigate to full notifications page
                  console.log('📧 View all notifications');
                }}
                className={`w-full text-center ${isExtension ? 'text-xs' : 'text-sm'} text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors`}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Service function to create notifications
export const createCommunityNotification = (
  type: CommunityNotification['type'],
  communityId: string,
  communityTitle: string,
  actionBy: { name: string; email: string },
  noteTitle?: string
): CommunityNotification => {
  const messages = {
    note_added: `${actionBy.name} added "${noteTitle}"`,
    note_edited: `${actionBy.name} edited "${noteTitle}"`,
    member_joined: `${actionBy.name} joined the community`,
    member_left: `${actionBy.name} left the community`,
  };

  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    communityId,
    communityTitle,
    message: messages[type],
    timestamp: new Date(),
    read: false,
    actionBy,
  };
};

export default NotificationCenter;