import chatModel from './chatModel.js';
import matchModel from '../match/matchModel.js';
import notificationModel from '../notification/notificationModel.js';

/**
 * POST /api/chat/conversations
 * Create a new conversation from a match
 */
export const createConversation = async (req, res, next) => {
  try {
    const { match_id } = req.body;
    const accountId = req.user?.accountId;

    if (!match_id) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }

    // Check if conversation already exists for this match
    const existingResult = await chatModel.getConversationByMatchId(match_id);
    if (existingResult.data) {
      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        data: existingResult.data,
        exists: true
      });
    }

    // Get match details to find participants
    const matchResult = await matchModel.getMatchById(match_id);
    if (!matchResult.success || !matchResult.data) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const match = matchResult.data;
    
    // Extract unique participant IDs
    const participants = new Set();
    if (match.LostPost?.Account?.account_id) {
      participants.add(match.LostPost.Account.account_id);
    }
    if (match.FoundPost?.Account?.account_id) {
      participants.add(match.FoundPost.Account.account_id);
    }
    if (match.created_by) {
      participants.add(match.created_by);
    }

    const participantArray = Array.from(participants);

    // Create conversation
    const result = await chatModel.createConversation(match_id, participantArray);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create conversation',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/conversations
 * Get all conversations for current user
 */
export const getConversations = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await chatModel.getConversationsByAccountId(accountId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversations',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/conversations/:id
 * Get conversation by ID
 */
export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.accountId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Check if user is a participant
    const isParticipant = await chatModel.isParticipant(id, accountId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this conversation'
      });
    }

    const result = await chatModel.getConversationById(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation',
        error: result.error
      });
    }

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/conversations/:id/messages
 * Get all messages in a conversation
 */
export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;
    const accountId = req.user?.accountId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Check if user is a participant
    const isParticipant = await chatModel.isParticipant(id, accountId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this conversation'
      });
    }

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const result = await chatModel.getMessagesByConversationId(id, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve messages',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/conversations/:id/messages
 * Send a message in a conversation
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const accountId = req.user?.accountId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long (max 5000 characters)'
      });
    }

    // Check if user is a participant
    const isParticipant = await chatModel.isParticipant(id, accountId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send messages in this conversation'
      });
    }

    const result = await chatModel.sendMessage(id, accountId, message.trim());

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: result.error
      });
    }

    // Notify other participants
    try {
      const convResult = await chatModel.getConversationById(id);
      if (convResult.success && convResult.data) {
        const participants = convResult.data.participants || [];
        
        for (const participant of participants) {
          if (participant.account_id !== accountId) {
            await notificationModel.createNotification(
              participant.account_id,
              'message',
              `New message in conversation`,
              id
            );
          }
        }
      }
    } catch (notifError) {
      console.error('Error creating message notification:', notifError);
      // Continue even if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

