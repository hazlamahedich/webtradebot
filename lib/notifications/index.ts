import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase/db';
import { 
  codeReviews, 
  reviewComments, 
  users, 
  organizationMembers 
} from '@/lib/supabase/schema';
import { eq, and } from 'drizzle-orm';
import { formatDate, getRelativeTime } from '@/lib/utils';

export enum NotificationType {
  NEW_REVIEW = 'new_review',
  REVIEW_COMPLETED = 'review_completed',
  NEW_COMMENT = 'new_comment',
  MENTION = 'mention',
  ASSIGNED = 'assigned',
  TEAM_ACTIVITY = 'team_activity',
  SYSTEM = 'system'
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
  sender?: {
    id: string;
    name: string;
    image?: string;
  };
  metadata?: Record<string, any>;
}

class NotificationService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Create a new notification
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    link,
    senderId,
    metadata
  }: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    senderId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          link,
          sender_id: senderId,
          metadata,
          read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      // If real-time notifications are set up, broadcast the event
      await this.supabase
        .channel('public:notifications')
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: { userId }
        });

      return data;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          id,
          type,
          title,
          message,
          link,
          created_at,
          read,
          metadata,
          sender:sender_id (
            id,
            name,
            image
          )
        `)
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting unread notifications:', error);
        return [];
      }

      return this.transformNotifications(data);
    } catch (error) {
      console.error('Error in getUnreadNotifications:', error);
      return [];
    }
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(userId: string, limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select(`
          id,
          type,
          title,
          message,
          link,
          created_at,
          read,
          metadata,
          sender:sender_id (
            id,
            name,
            image
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent notifications:', error);
        return [];
      }

      return this.transformNotifications(data);
    } catch (error) {
      console.error('Error in getRecentNotifications:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on('INSERT', (payload) => {
        callback(this.transformNotification(payload.new));
      })
      .subscribe();
  }

  /**
   * Transform notifications from database format to application format
   */
  private transformNotifications(notifications: any[]): Notification[] {
    return notifications.map(this.transformNotification);
  }

  /**
   * Transform a single notification from database format to application format
   */
  private transformNotification(notification: any): Notification {
    return {
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      createdAt: notification.created_at,
      read: notification.read,
      sender: notification.sender,
      metadata: notification.metadata
    };
  }

  /**
   * Notify team members about a new review
   */
  async notifyNewReview(
    reviewId: string, 
    creatorId: string, 
    organizationId: string
  ) {
    try {
      // Get the review details
      const review = await db.query.codeReviews.findFirst({
        where: eq(codeReviews.id, reviewId),
        with: {
          pullRequest: {
            with: {
              repository: true
            }
          },
          user: true
        }
      });

      if (!review) {
        console.error('Review not found');
        return;
      }

      // Get organization members to notify
      const members = await db.query.organizationMembers.findMany({
        where: and(
          eq(organizationMembers.orgId, organizationId),
          eq(organizationMembers.userId, creatorId)
        ),
        with: {
          user: true
        }
      });

      const title = `New Review: PR #${review.pullRequest.number}`;
      const message = `${review.user.name} created a new code review for ${review.pullRequest.title} in ${review.pullRequest.repository.name}`;
      const link = `/dashboard/reviews/${reviewId}`;

      // Notify each team member except the creator
      for (const member of members) {
        if (member.userId !== creatorId) {
          await this.createNotification({
            userId: member.userId,
            type: NotificationType.NEW_REVIEW,
            title,
            message,
            link,
            senderId: creatorId,
            metadata: {
              reviewId,
              pullRequestId: review.prId,
              repositoryId: review.pullRequest.repository.id
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in notifyNewReview:', error);
    }
  }

  /**
   * Notify about a completed review
   */
  async notifyReviewCompleted(reviewId: string) {
    try {
      // Get the review details
      const review = await db.query.codeReviews.findFirst({
        where: eq(codeReviews.id, reviewId),
        with: {
          pullRequest: {
            with: {
              repository: true
            }
          },
          user: true
        }
      });

      if (!review) {
        console.error('Review not found');
        return;
      }

      const title = `Review Completed: PR #${review.pullRequest.number}`;
      const message = `Code review for ${review.pullRequest.title} in ${review.pullRequest.repository.name} is now complete`;
      const link = `/dashboard/reviews/${reviewId}`;

      await this.createNotification({
        userId: review.userId,
        type: NotificationType.REVIEW_COMPLETED,
        title,
        message,
        link,
        metadata: {
          reviewId,
          pullRequestId: review.prId,
          repositoryId: review.pullRequest.repository.id,
          status: review.status
        }
      });
    } catch (error) {
      console.error('Error in notifyReviewCompleted:', error);
    }
  }

  /**
   * Notify about a new comment
   */
  async notifyNewComment(commentId: string) {
    try {
      // Get the comment details
      const comment = await db.query.reviewComments.findFirst({
        where: eq(reviewComments.id, commentId),
        with: {
          review: {
            with: {
              pullRequest: {
                with: {
                  repository: true
                }
              }
            }
          },
          user: true
        }
      });

      if (!comment) {
        console.error('Comment not found');
        return;
      }

      // If the comment author is the same as the review owner, don't notify
      if (comment.userId === comment.review.userId) {
        return;
      }

      const title = `New Comment on PR #${comment.review.pullRequest.number}`;
      const message = `${comment.user.name} commented on ${comment.review.pullRequest.title}`;
      const link = `/dashboard/reviews/${comment.reviewId}`;

      await this.createNotification({
        userId: comment.review.userId,
        type: NotificationType.NEW_COMMENT,
        title,
        message,
        link,
        senderId: comment.userId,
        metadata: {
          commentId,
          reviewId: comment.reviewId,
          pullRequestId: comment.review.prId,
          filePath: comment.filePath,
          lineNumber: comment.lineNumber
        }
      });

      // Check for mentions in the comment content
      this.processMentions(comment.content, comment.userId, link, {
        commentId,
        reviewId: comment.reviewId
      });
    } catch (error) {
      console.error('Error in notifyNewComment:', error);
    }
  }

  /**
   * Process mentions in a comment and send notifications
   */
  private async processMentions(
    content: string,
    authorId: string,
    link: string,
    metadata: Record<string, any>
  ) {
    // Simple regex to find @username mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = content.match(mentionRegex);

    if (!mentions) return;

    const author = await db.query.users.findFirst({
      where: eq(users.id, authorId)
    });

    if (!author) return;

    // Process each mention
    for (const mention of mentions) {
      const username = mention.substring(1); // Remove the @ symbol
      
      // Find the user by name (in a real app, you might want to use a username field)
      const mentionedUser = await db.query.users.findFirst({
        where: eq(users.name, username)
      });

      if (mentionedUser && mentionedUser.id !== authorId) {
        await this.createNotification({
          userId: mentionedUser.id,
          type: NotificationType.MENTION,
          title: `You were mentioned by ${author.name}`,
          message: `${author.name} mentioned you in a comment`,
          link,
          senderId: authorId,
          metadata
        });
      }
    }
  }
}

export const notificationService = new NotificationService(); 