import matchModel from './matchModel.js';
import notificationModel from '../notification/notificationModel.js';
import aiMatchingService from '../../utils/aiMatchingService.js';
import { sendMatchNotificationEmail } from '../../utils/emailService.js';
import accountModel from '../account/accountModel.js';

/**
 * POST /api/matches
 * Create a new match
 */
export const createMatch = async (req, res, next) => {
  try {
    const { lostPostId, foundPostId, confidenceScore = 0.8 } = req.body;
    const accountId = req.user?.accountId;

    // Validation
    if (!lostPostId || !foundPostId) {
      return res.status(400).json({
        success: false,
        message: 'lostPostId and foundPostId are required'
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Parse IDs if they come as strings (L55, F43) or use as integers
    const lostId = typeof lostPostId === 'string' && lostPostId.startsWith('L')
      ? parseInt(lostPostId.substring(1))
      : parseInt(lostPostId);
    const foundId = typeof foundPostId === 'string' && foundPostId.startsWith('F')
      ? parseInt(foundPostId.substring(1))
      : parseInt(foundPostId);

    if (isNaN(lostId) || isNaN(foundId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    // Create match
    const result = await matchModel.createMatch(lostId, foundId, confidenceScore);

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
      const notificationModel = (await import('../notification/notificationModel.js')).default;

      // Notify lost post owner if it's not the current user
      if (match.Lost_Post?.Account_id && match.Lost_Post.Account_id !== accountId) {
        await notificationModel.createNotification(
          match.Lost_Post.Account_id,
          'match',
          `AI found a potential match for your lost post: ${match.Lost_Post.Post_Title}`,
          `/posts/lost/${lostId}`,
          match.Match_id
        );
      }

      // Notify found post owner if it's not the current user
      if (match.Found_Post?.Account_id && match.Found_Post.Account_id !== accountId) {
        await notificationModel.createNotification(
          match.Found_Post.Account_id,
          'match',
          `AI found a potential match for your found post: ${match.Found_Post.Post_Title}`,
          `/posts/found/${foundId}`,
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

    const allPosts = postsResult.data || [];

    // ⚡ OPTIMIZATION: Get posts that already have matches (last 24 hours)
    const matchedPostIds = await matchModel.getPostIdsWithRecentMatches();
    console.log(`🔍 Found ${matchedPostIds.size} posts with existing matches (will skip)`);

    // Filter out posts that already have matches
    const posts = allPosts.filter(post => !matchedPostIds.has(post.Post_id));

    console.log(`📊 Optimized scan: ${allPosts.length} total posts → ${posts.length} posts to scan (skipped ${allPosts.length - posts.length})`);

    if (posts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new posts to scan (all posts already have matches)',
        data: {
          totalPosts: allPosts.length,
          skippedPosts: allPosts.length,
          scannedPosts: 0,
          matchesFound: 0,
          matchesCreated: 0,
          notificationsSent: 0
        }
      });
    }


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

/**
 * Core logic: Perform AI matching for a single post
 * Can be called directly without HTTP req/res
 * @param {string} postId 
 * @param {string} postType - 'lost' or 'found'
 * @returns {Promise<Object>}
 */
export async function performSinglePostScan(postId, postType) {
  try {
    console.log(`🔍 Event-driven AI scan triggered for ${postType} post: ${postId}`);

    // Get the newly approved post
    const postModel = (await import('../post/postModel.js')).default;
    const newPostResult = await postModel.getPostById(postId, postType);

    if (!newPostResult.success || !newPostResult.data) {
      throw new Error('Post not found');
    }

    const rawPost = newPostResult.data;

    // Transform from frontend format to AI format
    const newPost = {
      Post_id: `${postType === 'lost' ? 'L' : 'F'}${postId}`,
      Post_Title: rawPost.title || rawPost.Post_Title,
      Post_type: postType,
      Item_name: rawPost.itemName || rawPost.Item_name || '',
      Description: rawPost.description || rawPost.Description || '',
      Status: 'approved',
      Account_id: rawPost.accountId || rawPost.Account_id,
      Image_urls: rawPost.images || rawPost.Image_urls || []
    };

    console.log(`📋 Transformed post for AI: "${newPost.Post_Title}"`);


    // Get opposite type posts for matching
    const oppositePostsResult = await matchModel.getOppositeTypePosts(postType, postId);

    if (!oppositePostsResult.success) {
      throw new Error('Failed to retrieve posts for matching');
    }

    const oppositePosts = oppositePostsResult.data || [];

    if (oppositePosts.length === 0) {
      return {
        success: true,
        message: 'No opposite type posts available for matching',
        data: {
          postId,
          postType,
          matchesFound: 0,
          matchesCreated: 0,
          notificationsSent: 0
        }
      };
    }

    // Use AI to find matches
    const matches = await aiMatchingService.scanSinglePost(newPost, oppositePosts);

    if (matches.length === 0) {
      return {
        success: true,
        message: 'No matches found for this post',
        data: {
          postId,
          postType,
          matchesFound: 0,
          matchesCreated: 0,
          notificationsSent: 0
        }
      };
    }

    // Create matches in database
    const createResult = await matchModel.createBatchMatches(matches);

    if (!createResult.success) {
      throw new Error('Failed to create matches');
    }

    const createdMatches = createResult.data || [];

    // Send notifications to users
    const notificationModel = (await import('../notification/notificationModel.js')).default;

    // Socket layer is optional; if socket server isn't initialized,
    // still continue with DB notifications instead of failing the whole flow.
    let io = null;
    try {
      const socketModule = await import('../../socket/socket.js');
      io = socketModule?.getSocketIO?.();
    } catch (socketError) {
      console.warn('⚠️ Socket server not available, skipping realtime notifications:', socketError.message);
    }

    let notificationCount = 0;
    let emailCount = 0;

    for (const match of createdMatches) {
      // Notify both users: lost post owner and found post owner
      const lostPost = match.Lost_Post;
      const foundPost = match.Found_Post;

      // Notify lost post owner about found post
      if (lostPost && lostPost.account_id) {
        const lostAccountId = lostPost.account_id;
        const foundPostId = foundPost?.found_post_id;

        await notificationModel.createNotification(
          lostAccountId,
          'match',
          `AI đã tìm thấy bài đăng phù hợp: "${foundPost?.post_title || 'Đồ nhặt được'}"`,
          foundPostId ? `/posts/found/${foundPostId}` : '',
          match.match_id
        );

        // Send email notification
        try {
          const lostAccount = await accountModel.getById(lostAccountId);
          if (lostAccount && lostAccount.email) {
            const emailResult = await sendMatchNotificationEmail(
              lostAccount.email,
              lostAccount.user_name,
              lostPost.post_title || 'Bài đăng của bạn',
              foundPost?.post_title || 'Đồ nhặt được',
              match.confidence_score || 0.8
            );
            if (emailResult.success) {
              console.log(`📧 Email sent to lost post owner: ${lostAccount.email}`);
              emailCount++;
            } else {
              console.warn(`⚠️ Failed to send email to ${lostAccount.email}:`, emailResult.error);
            }
          }
        } catch (emailError) {
          console.error('❌ Error sending email to lost post owner:', emailError);
          // Continue even if email fails
        }

        if (io) {
          io.to(`user_${lostAccountId}`).emit('new_notification', {
            type: 'match',
            title: 'Tìm thấy kết quả phù hợp!',
            message: `AI đã tìm thấy bài đăng phù hợp: "${foundPost?.post_title || 'Đồ nhặt được'}"`,
            match_id: match.match_id
          });
        }

        notificationCount++;
      }

      // Notify found post owner about lost post
      if (foundPost && foundPost.account_id) {
        const foundAccountId = foundPost.account_id;
        const lostPostId = lostPost?.lost_post_id;

        await notificationModel.createNotification(
          foundAccountId,
          'match',
          `AI đã tìm thấy bài đăng phù hợp: "${lostPost?.post_title || 'Đồ mất'}"`,
          lostPostId ? `/posts/lost/${lostPostId}` : '',
          match.match_id
        );

        // Send email notification
        try {
          const foundAccount = await accountModel.getById(foundAccountId);
          if (foundAccount && foundAccount.email) {
            const emailResult = await sendMatchNotificationEmail(
              foundAccount.email,
              foundAccount.user_name,
              foundPost.post_title || 'Bài đăng của bạn',
              lostPost?.post_title || 'Đồ mất',
              match.confidence_score || 0.8
            );
            if (emailResult.success) {
              console.log(`📧 Email sent to found post owner: ${foundAccount.email}`);
              emailCount++;
            } else {
              console.warn(`⚠️ Failed to send email to ${foundAccount.email}:`, emailResult.error);
            }
          }
        } catch (emailError) {
          console.error('❌ Error sending email to found post owner:', emailError);
          // Continue even if email fails
        }

        if (io) {
          io.to(`user_${foundAccountId}`).emit('new_notification', {
            type: 'match',
            title: 'Tìm thấy kết quả phù hợp!',
            message: `AI đã tìm thấy bài đăng phù hợp: "${lostPost?.post_title || 'Đồ mất'}"`,
            match_id: match.match_id
          });
        }

        notificationCount++;
      }
    }

    console.log(`✅ Event-driven scan completed: ${matches.length} matches found, ${createdMatches.length} created, ${notificationCount} notifications sent, ${emailCount} emails sent`);

    return {
      success: true,
      message: 'AI matching completed successfully',
      data: {
        postId,
        postType,
        matchesFound: matches.length,
        matchesCreated: createdMatches.length,
        notificationsSent: notificationCount,
        emailsSent: emailCount,
        matches: createdMatches
      }
    };
  } catch (error) {
    console.error('❌ Error in performSinglePostScan:', error);
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
}

/**
 * POST /api/matches/scan-single
 * Scan a single newly approved post for matches (Event-driven)
 * Body: { postId, postType }
 */
export const scanSinglePost = async (req, res, next) => {
  try {
    const { postId, postType } = req.body;

    if (!postId || !postType) {
      return res.status(400).json({
        success: false,
        message: 'postId and postType are required'
      });
    }

    if (!['lost', 'found'].includes(postType)) {
      return res.status(400).json({
        success: false,
        message: 'postType must be "lost" or "found"'
      });
    }

    // Call the core logic function
    const result = await performSinglePostScan(postId, postType);

    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('❌ Error in scanSinglePost:', error);
    next(error);
  }
};

