import matchModel from './matchModel.js';
import notificationModel from '../notification/notificationModel.js';

/**
 * POST /api/matches
 * Create a new match
 */
export const createMatch = async (req, res, next) => {
  try {
    const { postId, confidenceScore = 0.8 } = req.body;
    const accountId = req.user?.accountId;

    // Validation
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'postId is required'
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Create match
    const result = await matchModel.createMatch(postId, confidenceScore);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create match',
        error: result.error
      });
    }

    // Create notifications for post owners
    try {
      const match = result.data;
      
      // Notify post owner if it's not the current user
      if (match.Post?.Account_id && match.Post.Account_id !== accountId) {
        await notificationModel.createNotification(
          match.Post.Account_id,
          'AI_Match',
          `AI found a potential match for your post: ${match.Post.Post_Title}`,
          match.Match_id
        );
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Continue even if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/matches/post/:postId
 * Get all matches for a specific post
 */
export const getMatchesByPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const result = await matchModel.getMatchesByPostId(postId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve matches',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Matches retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/matches/my
 * Get all matches for current user
 */
export const getMyMatches = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await matchModel.getMatchesByAccountId(accountId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve your matches',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Your matches retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/matches/:id/status
 * Update match status
 */
export const updateMatchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const accountId = req.user?.accountId;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "pending", "accepted", or "rejected"'
      });
    }

    // Check if user is participant (unless admin)
    if (userRole !== 'Admin') {
      const isParticipant = await matchModel.isMatchParticipant(id, accountId);
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this match'
        });
      }
    }

    const result = await matchModel.updateMatchStatus(id, status);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update match status',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Match status updated successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/matches/:id
 * Delete a match
 */
export const deleteMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.accountId;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }

    // Check if user is participant (unless admin)
    if (userRole !== 'Admin') {
      const isParticipant = await matchModel.isMatchParticipant(id, accountId);
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this match'
        });
      }
    }

    const result = await matchModel.deleteMatch(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete match',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/matches/:id
 * Get match by ID
 */
export const getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }

    const result = await matchModel.getMatchById(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve match',
        error: result.error
      });
    }

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Match retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

