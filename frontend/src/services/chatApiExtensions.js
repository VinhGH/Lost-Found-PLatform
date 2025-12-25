/**
 * Chat API Extensions
 * Additional chat-related API methods
 */

import httpClient from "./httpClient";

/**
 * Delete/recall a message
 * @param {number} conversationId
 * @param {number} messageId
 * @returns {Promise<Object>}
 */
export async function deleteMessage(conversationId, messageId) {
    try {
        console.log("🗑️ DELETE MESSAGE:", { conversationId, messageId });

        const response = await httpClient.delete(
            `/chat/conversations/${conversationId}/messages/${messageId}`,
            {},
            {},
            { preferUserToken: true }
        );

        return response;
    } catch (error) {
        console.error("❌ Delete message error:", error);
        return {
            success: false,
            error: error.message || "Không thể thu hồi tin nhắn",
        };
    }
}

/**
 * Send a reply message
 * @param {number} conversationId
 * @param {string} message
 * @param {number} replyToMessageId - ID of message being replied to
 * @returns {Promise<Object>}
 */
export async function sendReplyMessage(conversationId, message, replyToMessageId) {
    try {
        console.log("💬 SEND REPLY MESSAGE:", { conversationId, replyToMessageId });

        const response = await httpClient.post(
            `/chat/conversations/${conversationId}/messages`,
            {
                message,
                reply_to_message_id: replyToMessageId
            },
            {},
            { preferUserToken: true }
        );

        return response;
    } catch (error) {
        console.error("❌ Send reply message error:", error);
        return {
            success: false,
            error: error.message || "Không thể gửi tin nhắn trả lời",
        };
    }
}
