import { supabase } from '../../config/db.js';

class ChatModel {
  /**
   * Create a new conversation from a match
   * @param {string} matchId
   * @param {Array<number>} participants - Array of account IDs
   * @returns {Promise<Object>}
   */
  async createConversation(matchId, participants) {
    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('Conversation')
        .insert([{
          match_id: matchId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participantRecords = participants.map(accountId => ({
        conversation_id: conversation.conversation_id,
        account_id: accountId
      }));

      const { error: partError } = await supabase
        .from('ConversationParticipant')
        .insert(participantRecords);

      if (partError) throw partError;

      return {
        success: true,
        data: conversation,
        error: null
      };
    } catch (err) {
      console.error('Error creating conversation:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get all conversations for an account
   * @param {number} accountId
   * @returns {Promise<Object>}
   */
  async getConversationsByAccountId(accountId) {
    try {
      // Get conversation IDs where user is a participant AND not deleted
      const { data: participations, error: partError } = await supabase
        .from('ConversationParticipant')
        .select('conversation_id')
        .eq('account_id', accountId)
        .eq('is_deleted', false);

      if (partError) throw partError;

      const conversationIds = participations.map(p => p.conversation_id);

      if (conversationIds.length === 0) {
        return {
          success: true,
          data: [],
          error: null
        };
      }

      // Get full conversation details with post data
      const { data: conversations, error: convError } = await supabase
        .from('Conversation')
        .select(`
          *,
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            item_name,
            description,
            location_id,
            category_id,
            account_id,
            Account:account_id (
              account_id,
              user_name,
              avatar
            ),
            Lost_Post_Images (
              Lost_Images (
                link_picture
              )
            )
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            item_name,
            description,
            location_id,
            category_id,
            account_id,
            Account:account_id (
              account_id,
              user_name,
              avatar
            ),
            Found_Post_Images (
              Found_Images (
                link_picture
              )
            )
          ),
          Match:match_id (
            match_id
          )
        `)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      if (!conversations || conversations.length === 0) {
        return {
          success: true,
          data: [],
          error: null
        };
      }

      // ✅ Batch fetch participants for all conversations
      const { data: allParticipants } = await supabase
        .from('ConversationParticipant')
        .select(`
          conversation_id,
          account_id,
          Account:account_id (
            account_id,
            user_name,
            email,
            avatar
          )
        `)
        .in('conversation_id', conversationIds);

      // ✅ Batch fetch last messages for all conversations
      const { data: allMessages } = await supabase
        .from('Message')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Group participants and messages by conversation_id
      const participantsByConv = {};
      const lastMessageByConv = {};

      if (allParticipants) {
        allParticipants.forEach(p => {
          if (!participantsByConv[p.conversation_id]) {
            participantsByConv[p.conversation_id] = [];
          }
          participantsByConv[p.conversation_id].push(p);
        });
      }

      if (allMessages) {
        allMessages.forEach(msg => {
          if (!lastMessageByConv[msg.conversation_id]) {
            lastMessageByConv[msg.conversation_id] = msg;
          }
        });
      }

      // Attach to conversations
      for (const conv of conversations) {
        conv.participants = participantsByConv[conv.conversation_id] || [];
        conv.last_message = lastMessageByConv[conv.conversation_id] || null;
      }

      return {
        success: true,
        data: conversations || [],
        error: null
      };
    } catch (err) {
      console.error('Error getting conversations:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Send a message in a conversation
   * @param {string} conversationId
   * @param {number} senderId
   * @param {string} message
   * @returns {Promise<Object>}
   */
  async sendMessage(conversationId, senderId, message) {
    try {
      const { data, error } = await supabase
        .from('Message')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          message: message,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          Sender:sender_id (
            account_id,
            user_name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        error: null
      };
    } catch (err) {
      console.error('Error sending message:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get all messages in a conversation
   * @param {string} conversationId
   * @param {Object} options - { limit, offset }
   * @returns {Promise<Object>}
   */
  async getMessagesByConversationId(conversationId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const { data, error } = await supabase
        .from('Message')
        .select(`
          *,
          Sender:sender_id (
            account_id,
            user_name,
            avatar
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (err) {
      console.error('Error getting messages:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId
   * @returns {Promise<Object>}
   */
  async getConversationById(conversationId) {
    try {
      const { data, error } = await supabase
        .from('Conversation')
        .select(`
          *,
          Match:match_id (
            match_id
          ),
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            item_name,
            description,
            account_id,
            Account:account_id (
              account_id,
              user_name,
              avatar
            ),
            Lost_Post_Images (
              Lost_Images (
                link_picture
              )
            )
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            item_name,
            description,
            account_id,
            Account:account_id (
              account_id,
              user_name,
              avatar
            ),
            Found_Post_Images (
              Found_Images (
                link_picture
              )
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Get participants
        const { data: participants } = await supabase
          .from('ConversationParticipant')
          .select(`
            account_id,
            Account:account_id (
              account_id,
              user_name,
              email,
              avatar
            )
          `)
          .eq('conversation_id', conversationId);

        data.participants = participants || [];
      }

      return {
        success: true,
        data: data || null,
        error: null
      };
    } catch (err) {
      console.error('Error getting conversation:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Check if user is a participant in conversation
   * @param {string} conversationId
   * @param {number} accountId
   * @returns {Promise<boolean>}
   */
  async isParticipant(conversationId, accountId) {
    try {
      const { data, error } = await supabase
        .from('ConversationParticipant')
        .select('account_id')
        .eq('conversation_id', conversationId)
        .eq('account_id', accountId)
        .single();

      if (error) return false;

      return !!data;
    } catch (err) {
      console.error('Error checking participation:', err.message);
      return false;
    }
  }

  /**
   * Get conversation by match ID
   * @param {string} matchId
   * @returns {Promise<Object>}
   */
  async getConversationByMatchId(matchId) {
    try {
      const { data, error } = await supabase
        .from('Conversation')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        data: data || null,
        error: null
      };
    } catch (err) {
      console.error('Error getting conversation by match ID:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Create a new conversation linked to a post
   * @param {number} postId - ID of the post
   * @param {string} postType - 'lost' or 'found'
   * @param {Array<number>} participants - Array of account IDs
   * @returns {Promise<Object>}
   */
  async createConversationByPost(postId, postType, participants) {
    try {
      const postField = postType === 'lost' ? 'lost_post_id' : 'found_post_id';

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('Conversation')
        .insert([{
          [postField]: postId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participantRecords = participants.map(accountId => ({
        conversation_id: conversation.conversation_id,
        account_id: accountId,
        is_deleted: false
      }));

      const { error: partError } = await supabase
        .from('ConversationParticipant')
        .insert(participantRecords);

      if (partError) throw partError;

      // Fetch full conversation details to return
      return await this.getConversationById(conversation.conversation_id);
    } catch (err) {
      console.error('Error creating conversation by post:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get conversation by post ID for a specific user (not deleted)
   * @param {number} postId - ID of the post
   * @param {string} postType - 'lost' or 'found'
   * @param {number} accountId - ID of the user requesting
   * @returns {Promise<Object>}
   */
  async getConversationByPost(postId, postType, accountId) {
    try {
      const postField = postType === 'lost' ? 'lost_post_id' : 'found_post_id';

      // Get conversations for this post
      const { data: conversations, error: convError } = await supabase
        .from('Conversation')
        .select(`
          *,
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            item_name,
            description,
            account_id,
            Account:account_id (
              account_id,
              user_name,
              avatar
            ),
            Lost_Post_Images (
              Lost_Images (
                link_picture
              )
            )
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            item_name,
            description,
            account_id,
            Account:account_id (
              account_id,
              user_name,
              avatar
            ),
            Found_Post_Images (
              Found_Images (
                link_picture
              )
            )
          )
        `)
        .eq(postField, postId);

      if (convError) throw convError;

      if (!conversations || conversations.length === 0) {
        return {
          success: true,
          data: null,
          error: null
        };
      }

      // For each conversation, check if user is a participant and not deleted
      for (const conv of conversations) {
        const { data: participant, error: partError } = await supabase
          .from('ConversationParticipant')
          .select('*')
          .eq('conversation_id', conv.conversation_id)
          .eq('account_id', accountId)
          .single();

        if (!partError && participant && !participant.is_deleted) {
          // Get all participants
          const { data: participants } = await supabase
            .from('ConversationParticipant')
            .select(`
              account_id,
              is_deleted,
              Account:account_id (
                account_id,
                user_name,
                email,
                avatar
              )
            `)
            .eq('conversation_id', conv.conversation_id);

          conv.participants = participants || [];

          return {
            success: true,
            data: conv,
            error: null
          };
        }
      }

      // No valid conversation found
      return {
        success: true,
        data: null,
        error: null
      };
    } catch (err) {
      console.error('Error getting conversation by post:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Soft delete conversation for a specific user
   * @param {string} conversationId
   * @param {number} accountId
   * @returns {Promise<Object>}
   */
  async softDeleteConversation(conversationId, accountId) {
    try {
      const { error } = await supabase
        .from('ConversationParticipant')
        .update({ is_deleted: true })
        .eq('conversation_id', conversationId)
        .eq('account_id', accountId);

      if (error) throw error;

      return {
        success: true,
        data: { conversation_id: conversationId },
        error: null
      };
    } catch (err) {
      console.error('Error soft deleting conversation:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Mark all messages as read in a conversation for current user
   * @param {string} conversationId
   * @param {number} currentUserId - ID of user viewing the conversation
   * @returns {Promise<Object>}
   */
  async markMessagesAsRead(conversationId, currentUserId) {
    try {
      // Mark all unread messages from OTHER users as read
      const { data, error } = await supabase
        .from('Message')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', currentUserId) // Only mark messages from others
        .select();

      if (error) throw error;

      return {
        success: true,
        data: {
          marked_count: data?.length || 0,
          messages: data || []
        },
        error: null
      };
    } catch (err) {
      console.error('Error marking messages as read:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

}

export default new ChatModel();

