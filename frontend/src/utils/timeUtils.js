/**
 * Time Utility Functions
 * Shared utilities for time formatting and calculations
 */

/**
 * Calculate time ago from timestamp
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {number} currentTime - Current time (optional, defaults to Date.now())
 * @returns {string} - Formatted time string in Vietnamese
 */
export const getTimeAgo = (timestamp, currentTime = Date.now()) => {
    if (!timestamp) return "Vừa đăng";

    const now = currentTime;
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Vừa đăng";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    // Nếu quá 7 ngày, hiển thị ngày tháng
    const date = new Date(timestamp);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

/**
 * Format timestamp to Vietnamese date string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string
 */
export const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

/**
 * Format timestamp to Vietnamese datetime string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted datetime string
 */
export const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};
