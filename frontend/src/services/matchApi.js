/**
 * Match API Service
 * 
 * Service để quản lý AI matches
 * - Get matches của user
 * - Update match status
 * - Delete matches
 */

import httpClient from './httpClient.js';

class MatchApi {
    /**
     * Get all matches for current user
     * @returns {Promise<Object>}
     */
    async getMyMatches() {
        try {
            return await httpClient.get('/matches/my', {}, {}, { preferUser: true });
        } catch (error) {
            console.error('❌ Error getting my matches:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get matches for a specific post
     * @param {string} postId
     * @returns {Promise<Object>}
     */
    async getMatchesByPost(postId) {
        try {
            return await httpClient.get(`/matches/post/${postId}`, {}, {}, { preferUser: true });
        } catch (error) {
            console.error('❌ Error getting matches for post:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update match status
     * @param {string} matchId
     * @param {string} status - 'pending' | 'accepted' | 'rejected'
     * @returns {Promise<Object>}
     */
    async updateMatchStatus(matchId, status) {
        try {
            return await httpClient.put(
                `/matches/${matchId}/status`,
                { status },
                {},
                {},
                { preferUser: true }
            );
        } catch (error) {
            console.error('❌ Error updating match status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a match
     * @param {string} matchId
     * @returns {Promise<Object>}
     */
    async deleteMatch(matchId) {
        try {
            return await httpClient.delete(`/matches/${matchId}`, {}, {}, { preferUser: true });
        } catch (error) {
            console.error('❌ Error deleting match:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Trigger manual AI scan
     * @returns {Promise<Object>}
     */
    async triggerScan() {
        try {
            console.log('🔍 Triggering manual AI scan...');
            return await httpClient.post('/matches/scan', {}, {}, { preferUser: true });
        } catch (error) {
            console.error('❌ Error triggering scan:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new MatchApi();
