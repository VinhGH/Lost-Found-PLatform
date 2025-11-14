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
      // Get conversation IDs where user is a participant
      const { data: participations, error: partError } = await supabase
        .from('ConversationParticipant')
        .select('conversation_id')
        .eq('account_id', accountId);

      if (partError) throw partError;

      const conversationIds = participations.map(p => p.conversation_id);

      if (conversationIds.length === 0) {
        return {
          success: true,
          data: [],
          error: null
        };
      }

      // Get full conversation details
      const { data: conversations, error: convError } = await supabase
        .from('Conversation')
        .select(`
          *,
          Match:match_id (
            match_id,
            status,
            LostPost:lost_post_id (
              post_id,
              title,
              Account:account_id (
                account_id,
                user_name,
                avatar
              )
            ),
            FoundPost:found_post_id (
              post_id,
              title,
              Account:account_id (
                account_id,
                user_name,
                avatar
              )
            )
          )
        `)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      // Get participants for each conversation
      for (const conv of conversations) {
        const { data: participants, error: pError } = await supabase
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
          .eq('conversation_id', conv.conversation_id);

        if (!pError) {
          conv.participants = participants;
        }

        // Get last message
        const { data: lastMessage } = await supabase
          .from('Message')
          .select('*')
          .eq('conversation_id', conv.conversation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        conv.last_message = lastMessage || null;
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
            match_id,
            status,
            LostPost:lost_post_id (
              post_id,
              title
            ),
            FoundPost:found_post_id (
              post_id,
              title
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
}

export default new ChatModel();

