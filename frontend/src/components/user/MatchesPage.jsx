import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import matchApi from '../../services/matchApi';
import ImageCarousel from './ImageCarousel';
import {
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    Label as LabelIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import './MatchesPage.css';

const MatchesPage = ({ user, onNavigateToChat, onNavigateToPost }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMatches, setSelectedMatches] = useState(new Set());

    // Load matches when component mounts
    useEffect(() => {
        loadMatches();

        // Listen for matchesUpdated event
        const handleMatchesUpdated = () => {
            console.log('🔄 Matches updated, reloading...');
            loadMatches();
        };

        window.addEventListener('matchesUpdated', handleMatchesUpdated);
        return () => window.removeEventListener('matchesUpdated', handleMatchesUpdated);
    }, []);

    const loadMatches = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await matchApi.getMyMatches();

            if (response.success) {
                const matchesData = response.data || [];

                // ✅ Filter matches: only show those with confidence >= 60%
                const filteredMatches = matchesData.filter(match => {
                    const confidence = match.Confidence_score || 0;
                    return confidence >= 0.6; // Use 0.6 for decimal format (60%)
                });

                console.log('✅ Loaded matches:', matchesData.length, '→ Filtered (≥60%):', filteredMatches.length);
                setMatches(filteredMatches);
            } else {
                setError(response.error || 'Failed to load matches');
                setMatches([]);
            }
        } catch (err) {
            console.error('❌ Error loading matches:', err);
            setError(err.message);
            setMatches([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMatch = async (matchId) => {
        if (!window.confirm('Bạn có chắc muốn xóa match này?')) return;

        try {
            const response = await matchApi.deleteMatch(matchId);

            if (response.success) {
                // Remove from UI
                setMatches(prev => prev.filter(m => m.Match_id !== matchId));
                console.log('✅ Match deleted');
            } else {
                alert('Lỗi: ' + (response.error || 'Không thể xóa match'));
            }
        } catch (err) {
            console.error('❌ Error deleting match:', err);
            alert('Lỗi: ' + err.message);
        }
    };

    // Toggle selection mode
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedMatches(new Set()); // Clear selections when toggling
    };

    // Toggle single match selection
    const toggleMatchSelection = (matchId) => {
        setSelectedMatches(prev => {
            const newSet = new Set(prev);
            if (newSet.has(matchId)) {
                newSet.delete(matchId);
            } else {
                newSet.add(matchId);
            }
            return newSet;
        });
    };

    // Select all matches
    const selectAll = () => {
        setSelectedMatches(new Set(matches.map(m => m.Match_id)));
    };

    // Clear all selections
    const clearAll = () => {
        setSelectedMatches(new Set());
    };

    // Bulk delete selected matches
    const handleBulkDelete = async () => {
        const count = selectedMatches.size;
        if (!window.confirm(`Bạn có chắc muốn xóa ${count} matches đã chọn?`)) return;

        try {
            // Delete all selected matches in parallel
            const deletePromises = Array.from(selectedMatches).map(matchId =>
                matchApi.deleteMatch(matchId)
            );

            await Promise.all(deletePromises);

            // Remove from UI
            setMatches(prev => prev.filter(m => !selectedMatches.has(m.Match_id)));
            setSelectedMatches(new Set());
            setIsSelectionMode(false);

            console.log(`✅ Deleted ${count} matches`);
        } catch (err) {
            console.error('❌ Error deleting matches:', err);
            alert('Lỗi: ' + err.message);
        }
    };

    // Helper function to extract images from matched post
    const getMatchImages = (match) => {
        const post = match.Post;
        if (!post) return [];

        // Try Image_urls first (array)
        if (post.Image_urls && Array.isArray(post.Image_urls) && post.Image_urls.length > 0) {
            return post.Image_urls;
        }

        // Fallback to single image
        if (post.image) {
            return [post.image];
        }

        // No images
        return [];
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };


    const handleChatWithMatch = (match) => {
        // Navigate to chat with the matched post owner
        if (match.Post && match.Post.Account_id && onNavigateToChat) {
            // Parse Post_id: "L43" -> "43", "F44" -> "44"
            const postId = match.Post.Post_id.replace(/^[LF]/, '');
            const postType = match.Post.Post_type || 'found';
            const postAuthorId = match.Post.Account_id;

            // ✅ Pass complete post information for conversation creation
            onNavigateToChat({
                postId: postId,
                postType: postType,
                postAuthorId: postAuthorId
            });
        }
    };

    const handleViewPost = (match) => {
        // Navigate to the matched post
        if (match.Post && match.Post.Post_id && onNavigateToPost) {
            const postType = match.Post.Post_type || 'found';
            // Parse Post_id: "L43" -> "43", "F44" -> "44"
            const postId = match.Post.Post_id.replace(/^[LF]/, '');
            onNavigateToPost(postId, postType);
        }
    };

    // Helper function to render a single match card
    const renderMatchCard = (match, isHighMatch = false) => {
        const isSelected = selectedMatches.has(match.Match_id);
        const matchImages = getMatchImages(match);

        return (
            <div
                key={match.Match_id}
                className={`match-card ${isSelectionMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''} ${isHighMatch ? 'high-match' : ''}`}
                onClick={() => isSelectionMode && toggleMatchSelection(match.Match_id)}
            >
                {/* Image Section */}
                <div className="match-image-wrapper">
                    {matchImages.length > 0 ? (
                        <ImageCarousel images={matchImages} postId={match.Match_id} />
                    ) : (
                        <div className="match-no-image">
                            <PersonIcon style={{ fontSize: '48px', color: '#CBD5E1' }} />
                        </div>
                    )}
                    <div className="match-badge">
                        {Math.round((match.Confidence_score || 0) * 100)}% Match
                    </div>
                    {/* Checkbox in selection mode */}
                    {isSelectionMode && (
                        <div className="match-checkbox-wrapper">
                            <input
                                type="checkbox"
                                className="match-checkbox"
                                checked={isSelected}
                                onChange={() => toggleMatchSelection(match.Match_id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="match-content">
                    <h3 className="match-title">{match.Post?.Post_Title || 'Bài đăng'}</h3>
                    <p className="match-description">
                        {match.Post?.Description || 'Không có mô tả'}
                    </p>

                    {/* Meta Information */}
                    <div className="match-meta">
                        {match.Post?.Location_name && (
                            <div className="meta-item">
                                <LocationIcon style={{ fontSize: '14px' }} />
                                <span className="meta-text">{match.Post.Location_name}</span>
                            </div>
                        )}
                        {match.Post?.Category_name && (
                            <div className="meta-item">
                                <LabelIcon style={{ fontSize: '14px' }} />
                                <span className="meta-text">{match.Post.Category_name}</span>
                            </div>
                        )}
                        <div className="meta-item">
                            <TimeIcon style={{ fontSize: '14px' }} />
                            <span className="meta-text">{formatDate(match.Matched_at)}</span>
                        </div>
                        <div className="meta-item">
                            <PersonIcon style={{ fontSize: '14px' }} />
                            <span className="meta-text">
                                {match.Post?.Post_type === 'lost' ? 'Đồ mất' : 'Đồ nhặt được'}
                            </span>
                        </div>
                    </div>

                    {/* Your Post Reference */}
                    {match.Your_Post && (
                        <div className="your-post-ref">
                            ↳ Khớp với: <strong>"{match.Your_Post.Post_Title}"</strong>
                        </div>
                    )}

                    <div className="match-actions">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewPost(match);
                            }}
                            className="btn-view"
                            title="Xem bài đăng"
                        >
                            Xem chi tiết
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleChatWithMatch(match);
                            }}
                            className="btn-chat"
                            title="Chat với người đăng"
                        >
                            Nhắn tin
                        </button>
                        {/* Hide delete button in selection mode */}
                        {!isSelectionMode && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMatch(match.Match_id);
                                }}
                                className="btn-delete"
                                title="Xóa match này"
                            >
                                Xóa
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="matches-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải matches...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="matches-page">
                <div className="error-container">
                    <p>❌ {error}</p>
                    <button onClick={loadMatches} className="retry-btn">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Split matches into high-confidence and regular
    const highMatches = matches.filter(m => (m.Confidence_score || 0) * 100 >= 80);
    const regularMatches = matches.filter(m => (m.Confidence_score || 0) * 100 < 80);

    return (
        <div className="matches-page">
            <div className="matches-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>
                        <DotLottieReact
                            src="https://lottie.host/2de4e929-6cf6-412d-a39a-7db8817377cf/VEOFwd8TTe.lottie"
                            loop
                            autoplay
                            style={{ width: '32px', height: '32px', display: 'inline-block', verticalAlign: 'middle', marginRight: '10px' }}
                        />
                        AI Matches
                    </h2>
                    {matches.length > 0 && (
                        <button
                            onClick={toggleSelectionMode}
                            className={`selection-toggle-btn ${isSelectionMode ? 'cancel' : ''}`}
                        >
                            {isSelectionMode ? 'Hủy' : 'Chọn nhiều'}
                        </button>
                    )}
                </div>
                <p className="matches-subtitle">
                    {matches.length > 0
                        ? `Tìm thấy ${matches.length} kết quả phù hợp với bài đăng của bạn`
                        : 'Chưa có kết quả phù hợp. AI sẽ tự động quét mỗi giờ.'}
                </p>
            </div>

            {/* Bulk Action Bar - Only show when in selection mode and items selected */}
            {isSelectionMode && selectedMatches.size > 0 && (
                <div className="bulk-action-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontWeight: '600', color: '#1E293B' }}>
                            {selectedMatches.size} mục đã chọn
                        </span>
                        <button
                            onClick={selectedMatches.size === matches.length ? clearAll : selectAll}
                            className="btn-select-toggle"
                        >
                            {selectedMatches.size === matches.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>
                    <button onClick={handleBulkDelete} className="btn-bulk-delete">
                        Xóa đã chọn
                    </button>
                </div>
            )}

            {matches.length === 0 ? (
                <div className="no-matches">
                    <div className="no-matches-icon">
                        <DotLottieReact
                            src="https://lottie.host/229f27e9-f947-418e-9376-1f10413621dc/QRO219EUcN.lottie"
                            loop
                            autoplay
                            style={{ width: '160px', height: '160px' }}
                        />
                    </div>
                    <h3>Chưa có matches</h3>
                    <p>AI sẽ tự động quét và tìm các bài đăng phù hợp mỗi giờ.</p>
                </div>
            ) : (
                <>
                    {/* High Confidence Matches Section (>= 80%) */}
                    {highMatches.length > 0 && (
                        <div className="matches-section">
                            <div className="section-header high-match-header">
                                <h3>🔥 Bài đăng phù hợp nhất</h3>
                                <span className="section-count">{highMatches.length} kết quả</span>
                            </div>
                            <div className="matches-list">
                                {highMatches.map(match => renderMatchCard(match, true))}
                            </div>
                        </div>
                    )}

                    {/* Regular Matches Section (< 80%) */}
                    {regularMatches.length > 0 && (
                        <div className="matches-section">
                            {highMatches.length > 0 && (
                                <div className="section-header">
                                    <h3>Các kết quả khác</h3>
                                    <span className="section-count">{regularMatches.length} kết quả</span>
                                </div>
                            )}
                            <div className="matches-list">
                                {regularMatches.map(match => renderMatchCard(match, false))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MatchesPage;
