/**
 * DELETE /api/chat/conversations/:id/messages/:messageId
 * Delete/recall a message (only by sender)
 */
export const deleteMessage = async (req, res, next) => {
    try {
        const { id, messageId } = req.params;
        const accountId = req.user?.accountId;

        if (!id || !messageId) {
            return res.status(400).json({
                success: false,
                message: 'Conversation ID and Message ID are required'
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

        // Check if message exists and belongs to the user
        const messageResult = await chatModel.getMessageById(messageId);
        if (!messageResult.success || !messageResult.data) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Verify the message belongs to the user
        if (messageResult.data.sender_id !== accountId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own messages'
            });
        }

        // Delete the message
        const result = await chatModel.deleteMessage(messageId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete message',
                error: result.error
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};
