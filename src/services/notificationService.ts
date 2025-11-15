import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  updateDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CommunityNotification } from '../components/NotificationCenter';

export class NotificationService {
  private static readonly NOTIFICATIONS_COLLECTION = 'notifications';

  /**
   * Create a notification for collaborator activities
   * Supports optional userId and ownerEmail for targeted notifications (admin/owner only)
   */
  static async createNotification(
    notification: Omit<CommunityNotification, 'id' | 'timestamp' | 'read'> & {
      userId?: string;
      ownerEmail?: string;
    }
  ): Promise<void> {
    try {
      const notificationRef = doc(collection(db, this.NOTIFICATIONS_COLLECTION));
      const notificationData: any = {
        type: notification.type,
        communityId: notification.communityId,
        communityTitle: notification.communityTitle,
        message: notification.message,
        actionBy: notification.actionBy,
        id: notificationRef.id,
        timestamp: Timestamp.now(),
        read: false,
      };

      // Add optional targeting fields for admin/owner-only notifications
      if (notification.userId) {
        notificationData.userId = notification.userId;
      }
      if (notification.ownerEmail) {
        notificationData.ownerEmail = notification.ownerEmail;
      }

      await setDoc(notificationRef, notificationData);
      console.log('✅ Notification created:', notificationRef.id);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get notifications for a user (by email or community)
   * Only shows notifications for groups where user is owner or collaborator
   * For targeted notifications (with userId/ownerEmail), only show to the specific admin/owner
   */
  static async getNotifications(
    userEmail: string,
    limitCount: number = 50,
    userId?: string
  ): Promise<CommunityNotification[]> {
    try {
      // Import GroupsService to check group ownership/collaboration
      const { default: GroupsService } = await import('./groupsService');
      
      // Get all notifications and filter client-side (since != queries need indexes)
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount * 3) // Get more to account for filtering
      );

      const querySnapshot = await getDocs(q);
      const notifications: CommunityNotification[] = [];
      const normalizedUserEmail = userEmail.toLowerCase().trim();

      // Get all groups where user is owner or collaborator
      const userGroups = await GroupsService.getUserGroups(userEmail);
      const sharedGroups = await GroupsService.getGroupsSharedWithUser(userEmail);
      
      // Create a set of shareIds where user has access
      const accessibleShareIds = new Set<string>();
      
      // Add shareIds from owned groups
      userGroups.forEach(group => {
        if (group.shareId) {
          accessibleShareIds.add(group.shareId);
        }
      });
      
      // Add shareIds from shared groups (where user is collaborator)
      sharedGroups.forEach(group => {
        if (group.shareId) {
          accessibleShareIds.add(group.shareId);
        }
      });

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip notifications where user is the actor
        if (data.actionBy?.email?.toLowerCase() === normalizedUserEmail) {
          return;
        }
        
        // If notification has userId or ownerEmail, only show to that specific user (admin/owner)
        if (data.userId || data.ownerEmail) {
          const targetUserId = data.userId;
          const targetOwnerEmail = data.ownerEmail?.toLowerCase().trim();
          
          // Check if this notification is targeted to the current user
          const isTargetedToUser = 
            (targetUserId && userId && String(targetUserId) === String(userId)) ||
            (targetOwnerEmail && targetOwnerEmail === normalizedUserEmail);
          
          if (isTargetedToUser) {
            notifications.push({
              id: doc.id,
              type: data.type,
              communityId: data.communityId,
              communityTitle: data.communityTitle,
              message: data.message,
              timestamp: data.timestamp?.toDate() || new Date(),
              read: data.read || false,
              actionBy: data.actionBy,
            });
          }
          return; // Skip further processing for targeted notifications
        }
        
        // For non-targeted notifications, only include for groups where user is owner or collaborator
        const communityId = data.communityId;
        if (communityId && accessibleShareIds.has(communityId)) {
          notifications.push({
            id: doc.id,
            type: data.type,
            communityId: data.communityId,
            communityTitle: data.communityTitle,
            message: data.message,
            timestamp: data.timestamp?.toDate() || new Date(),
            read: data.read || false,
            actionBy: data.actionBy,
          });
        }
      });

      // Return only the requested limit
      return notifications.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting notifications:', error);
      // If query fails (e.g., no index), return empty array
      return [];
    }
  }

  /**
   * Get notifications for a specific shared note/community
   */
  static async getNotificationsForShare(
    shareId: string,
    limitCount: number = 50
  ): Promise<CommunityNotification[]> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('communityId', '==', shareId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications: CommunityNotification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          type: data.type,
          communityId: data.communityId,
          communityTitle: data.communityTitle,
          message: data.message,
          timestamp: data.timestamp?.toDate() || new Date(),
          read: data.read || false,
          actionBy: data.actionBy,
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting notifications for share:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   * For targeted notifications (with userId/ownerEmail), only show to the specific admin/owner
   */
  static subscribeToNotifications(
    userEmail: string,
    callback: (notifications: CommunityNotification[]) => void,
    userId?: string
  ): () => void {
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let unsubscribe: (() => void) | null = null;
    let groupRefreshInterval: ReturnType<typeof setInterval> | null = null;
    let accessibleShareIds = new Set<string>();

    // Initialize accessible groups asynchronously
    (async () => {
      try {
        const { default: GroupsService } = await import('./groupsService');
        
        // Load groups once and cache shareIds
        const loadAccessibleGroups = async () => {
          try {
            const userGroups = await GroupsService.getUserGroups(userEmail);
            const sharedGroups = await GroupsService.getGroupsSharedWithUser(userEmail);
            
            accessibleShareIds.clear();
            userGroups.forEach(group => {
              if (group.shareId) accessibleShareIds.add(group.shareId);
            });
            sharedGroups.forEach(group => {
              if (group.shareId) accessibleShareIds.add(group.shareId);
            });
          } catch (err) {
            console.error('Error loading accessible groups for notifications:', err);
          }
        };
        
        // Load groups initially
        await loadAccessibleGroups();
        
        // Refresh groups every 30 seconds to catch new shares
        groupRefreshInterval = setInterval(loadAccessibleGroups, 30000);

        const q = query(
          collection(db, this.NOTIFICATIONS_COLLECTION),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const notifications: CommunityNotification[] = [];
            const normalizedUserEmail = userEmail.toLowerCase().trim();

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              
              // Skip notifications where user is the actor
              if (data.actionBy?.email?.toLowerCase() === normalizedUserEmail) {
                return;
              }
              
              // If notification has userId or ownerEmail, only show to that specific user (admin/owner)
              if (data.userId || data.ownerEmail) {
                const targetUserId = data.userId;
                const targetOwnerEmail = data.ownerEmail?.toLowerCase().trim();
                
                // Check if this notification is targeted to the current user
                const isTargetedToUser = 
                  (targetUserId && userId && String(targetUserId) === String(userId)) ||
                  (targetOwnerEmail && targetOwnerEmail === normalizedUserEmail);
                
                if (isTargetedToUser) {
                  notifications.push({
                    id: doc.id,
                    type: data.type,
                    communityId: data.communityId,
                    communityTitle: data.communityTitle,
                    message: data.message,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    read: data.read || false,
                    actionBy: data.actionBy,
                  });
                }
                return; // Skip further processing for targeted notifications
              }
              
              // For non-targeted notifications, only include for groups where user is owner or collaborator
              const communityId = data.communityId;
              if (communityId && accessibleShareIds.has(communityId)) {
                notifications.push({
                  id: doc.id,
                  type: data.type,
                  communityId: data.communityId,
                  communityTitle: data.communityTitle,
                  message: data.message,
                  timestamp: data.timestamp?.toDate() || new Date(),
                  read: data.read || false,
                  actionBy: data.actionBy,
                });
              }
            });

            callback(notifications);
          },
          (error: any) => {
            console.error('❌ Error in notification subscription:', error);
            if (error?.code === 'unavailable' || error?.message?.includes('ERR_BLOCKED_BY_CLIENT') || error?.message?.includes('network')) {
              console.warn('⚠️ Firestore real-time listener blocked. This may be due to:');
              console.warn('1. Ad blockers blocking WebSocket connections');
              console.warn('2. Browser extensions blocking Firestore');
              console.warn('3. Network/firewall restrictions');
              console.warn('📦 Falling back to polling mode');
              // Fallback: Poll for notifications every 30 seconds
              pollInterval = setInterval(async () => {
                try {
                  const notifications = await this.getNotifications(userEmail, 50, userId);
                  callback(notifications);
                } catch (err) {
                  console.error('Error polling notifications:', err);
                }
              }, 30000);
            }
            callback([]);
          }
        );
      } catch (error) {
        console.error('Error subscribing to notifications:', error);
        // Fallback to polling if subscription fails
        pollInterval = setInterval(async () => {
          try {
            const notifications = await this.getNotifications(userEmail, 50, userId);
            callback(notifications);
          } catch (err) {
            console.error('Error polling notifications:', err);
          }
        }, 30000);
      }
    })();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (groupRefreshInterval) {
        clearInterval(groupRefreshInterval);
      }
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userEmail: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return data.actionBy?.email !== userEmail; // Don't mark user's own notifications
        })
        .map((doc) => updateDoc(doc.ref, { read: true }));

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, { deleted: true });
      // Or use deleteDoc if you want to permanently delete
      // await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }
}

export default NotificationService;

