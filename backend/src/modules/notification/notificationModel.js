import { supabase } from '../../config/db.js';

class NotificationModel {
  /**
   * Create a new notification
   * @param {number} accountId
   * @param {string} type - 'post_pending' | 'post_approved' | 'post_rejected' | 'match' | 'message'
   * @param {string} message - Notification message content
   * @param {string} link - Link to related resource
   * @param {number} matchId - Optional match_id for AI matching notifications
   * @returns {Promise<Object>}
   */
  async createNotification(accountId, type, message, link = '', matchId = null) {
    try {
      const { data, error } = await supabase
        .from('Notification')
        .insert([{
          account_id: accountId,
          type,
          message,
          link,
          match_id: matchId,
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        error: null
      };
    } catch (err) {
      console.error('Error creating notification:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get all notifications for an account
   * @param {number} accountId
   * @param {Object} filters - { is_read, limit }
   * @returns {Promise<Object>}
   */
  async getNotificationsByAccountId(accountId, filters = {}) {
    try {
      const { is_read, limit = 50 } = filters;

      let query = supabase
        .from('Notification')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by read status if specified
      if (is_read !== undefined) {
        query = query.eq('is_read', is_read);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (err) {
      console.error('Error getting notifications:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('Notification')
        .update({ is_read: true })
        .eq('notification_id', notificationId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        error: null
      };
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Mark all notifications as read for an account
   * @param {number} accountId
   * @returns {Promise<Object>}
   */
  async markAllAsRead(accountId) {
    try {
      const { data, error } = await supabase
        .from('Notification')
        .update({ is_read: true })
        .eq('account_id', accountId)
        .eq('is_read', false)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data,
        count: data?.length || 0,
        error: null
      };
    } catch (err) {
      console.error('Error marking all notifications as read:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId
   * @returns {Promise<Object>}
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('Notification')
        .delete()
        .eq('notification_id', notificationId);

      if (error) throw error;

      return {
        success: true,
        error: null
      };
    } catch (err) {
      console.error('Error deleting notification:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Get unread notification count
   * @param {number} accountId
   * @returns {Promise<Object>}
   */
  async getUnreadCount(accountId) {
    try {
      const { count, error } = await supabase
        .from('Notification')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('is_read', false);

      if (error) throw error;

      return {
        success: true,
        count: count || 0,
        error: null
      };
    } catch (err) {
      console.error('Error getting unread count:', err.message);
      return {
        success: false,
        count: 0,
        error: err.message
      };
    }
  }

  /**
   * Check if notification belongs to user
   * @param {string} notificationId
   * @param {number} accountId
   * @returns {Promise<boolean>}
   */
  async isNotificationOwner(notificationId, accountId) {
    try {
      const { data, error } = await supabase
        .from('Notification')
        .select('account_id')
        .eq('notification_id', notificationId)
        .single();

      if (error) return false;

      return data && data.account_id === accountId;
    } catch (err) {
      console.error('Error checking notification ownership:', err.message);
      return false;
    }
  }
}

export default new NotificationModel();

