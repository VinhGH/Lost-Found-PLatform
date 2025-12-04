import matchModel from './matchModel.js';
import notificationModel from '../notification/notificationModel.js';
import aiMatchingService from '../../utils/aiMatchingService.js';

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

/**
 * POST /api/matches/scan
 * Scan for AI matches automatically
 * Quét tất cả bài đăng approved trong 30 ngày và tìm matches
 */
export const scanForMatches = async (req, res, next) => {
  try {
    console.log('🔍 Starting AI matching scan...');

    // Get recent approved posts (last 30 days)
    const postsResult = await matchModel.getRecentApprovedPosts();

    if (!postsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve posts for scanning',
        error: postsResult.error
      });
    }

    const posts = postsResult.data || [];

    if (posts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No posts to scan',
        data: {
          scannedPosts: 0,
          matchesFound: 0,
          matchesCreated: 0,
          notificationsSent: 0
        }
      });
    }

    console.log(`📊 Found ${posts.length} posts to scan`);

    // Use AI service to find matches
    const matches = await aiMatchingService.findMatchingPosts(posts);

    console.log(`✅ AI found ${matches.length} potential matches`);

    if (matches.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Scan completed, no matches found',
        data: {
          scannedPosts: posts.length,
          matchesFound: 0,
          matchesCreated: 0,
          notificationsSent: 0
        }
      });
    }

    // Create matches in database
    const createResult = await matchModel.createBatchMatches(matches);

    if (!createResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create matches',
        error: createResult.error
      });
    }

    const createdMatches = createResult.data || [];
    console.log(`💾 Created ${createdMatches.length} new matches in database`);

    // Create notifications for post owners
    let notificationCount = 0;
    let imageMatchesCount = 0;
    let textOnlyMatchesCount = 0;
    
    try {
      for (const match of matches) {
        const { post1, post2, similarity, hasImages, textSimilarity, imageSimilarity } = match;

        // Count match types
        if (hasImages) {
          imageMatchesCount++;
        } else {
          textOnlyMatchesCount++;
        }

        // Create notification message with details
        let message = `AI found a ${Math.round(similarity * 100)}% match`;
        if (hasImages && imageSimilarity > 0) {
          message += ` (Text: ${Math.round(textSimilarity * 100)}%, Image: ${Math.round(imageSimilarity * 100)}%)`;
        } else {
          message += ` (Text: ${Math.round(textSimilarity * 100)}%)`;
        }
        message += ` for your post: ${post1.Post_Title}`;

        // Notify post1 owner
        if (post1.Account_id) {
          await notificationModel.createNotification(
            post1.Account_id,
            'AI_Match',
            message,
            post1.Post_id
          );
          notificationCount++;
        }

        // Notify post2 owner (if different from post1 owner)
        if (post2.Account_id && post2.Account_id !== post1.Account_id) {
          let message2 = `AI found a ${Math.round(similarity * 100)}% match`;
          if (hasImages && imageSimilarity > 0) {
            message2 += ` (Text: ${Math.round(textSimilarity * 100)}%, Image: ${Math.round(imageSimilarity * 100)}%)`;
          } else {
            message2 += ` (Text: ${Math.round(textSimilarity * 100)}%)`;
          }
          message2 += ` for your post: ${post2.Post_Title}`;

          await notificationModel.createNotification(
            post2.Account_id,
            'AI_Match',
            message2,
            post2.Post_id
          );
          notificationCount++;
        }
      }
      console.log(`📨 Sent ${notificationCount} notifications`);
      console.log(`📊 Match breakdown: ${imageMatchesCount} with images, ${textOnlyMatchesCount} text-only`);
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
      // Continue even if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'AI matching scan completed successfully',
      data: {
        scannedPosts: posts.length,
        matchesFound: matches.length,
        matchesCreated: createdMatches.length,
        notificationsSent: notificationCount,
        imageMatches: imageMatchesCount,
        textOnlyMatches: textOnlyMatchesCount,
        matches: createdMatches
      }
    });
  } catch (error) {
    console.error('❌ Error in scanForMatches:', error);
    next(error);
  }
};

