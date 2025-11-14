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
   */
  static async createNotification(
    notification: Omit<CommunityNotification, 'id' | 'timestamp' | 'read'>
  ): Promise<void> {
    try {
      const notificationRef = doc(collection(db, this.NOTIFICATIONS_COLLECTION));
      const notificationData = {
        ...notification,
        id: notificationRef.id,
        timestamp: Timestamp.now(),
        read: false,
      };

      await setDoc(notificationRef, notificationData);
      console.log('✅ Notification created:', notificationRef.id);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get notifications for a user (by email or community)
   */
  static async getNotifications(
    userEmail: string,
    limitCount: number = 50
  ): Promise<CommunityNotification[]> {
    try {
      // Get all notifications and filter client-side (since != queries need indexes)
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount * 2) // Get more to account for filtering
      );

      const querySnapshot = await getDocs(q);
      const notifications: CommunityNotification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out notifications where user is the actor
        if (data.actionBy?.email?.toLowerCase() !== userEmail.toLowerCase()) {
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
   */
  static subscribeToNotifications(
    userEmail: string,
    callback: (notifications: CommunityNotification[]) => void
  ): () => void {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const notifications: CommunityNotification[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Filter out notifications where user is the actor
            if (data.actionBy?.email !== userEmail) {
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
        (error) => {
          console.error('Error in notification subscription:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return () => {}; // Return no-op function
    }
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

