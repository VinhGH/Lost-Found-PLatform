import notificationModel from './notificationModel.js';

/**
 * GET /api/notifications
 * Get all notifications for current user
 */
export const getNotifications = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;
    const { is_read, limit } = req.query;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const filters = {};
    if (is_read !== undefined) {
      filters.is_read = is_read === 'true';
    }
    if (limit) {
      filters.limit = parseInt(limit);
    }

    const result = await notificationModel.getNotificationsByAccountId(accountId, filters);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await notificationModel.getUnreadCount(accountId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved successfully',
      count: result.count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.accountId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    // Check if notification belongs to user
    const isOwner = await notificationModel.isNotificationOwner(id, accountId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this notification'
      });
    }

    const result = await notificationModel.markAsRead(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await notificationModel.markAllAsRead(accountId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      count: result.count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.accountId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    // Check if notification belongs to user
    const isOwner = await notificationModel.isNotificationOwner(id, accountId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this notification'
      });
    }

    const result = await notificationModel.deleteNotification(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

