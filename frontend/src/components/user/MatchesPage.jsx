import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import matchApi from '../../services/matchApi';
import './MatchesPage.css';

const MatchesPage = ({ user, onNavigateToChat, onNavigateToPost }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                console.log('✅ Loaded matches:', matchesData);
                setMatches(matchesData);
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

    const handleChatWithMatch = (match) => {
        // Navigate to chat with the matched post owner
        if (match.Post && match.Post.Account_id && onNavigateToChat) {
            onNavigateToChat({
                id: match.Post.Account_id,
                name: match.Post.Post_Title || 'User'
            });
        }
    };

    const handleViewPost = (match) => {
        // Navigate to the matched post
        if (match.Post && match.Post.Post_id && onNavigateToPost) {
            const postType = match.Post.Post_type || 'found';
            onNavigateToPost(match.Post.Post_id, postType);
        }
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

    return (
        <div className="matches-page">
            <div className="matches-header">
                <h2>
                    <DotLottieReact
                        src="https://lottie.host/2de4e929-6cf6-412d-a39a-7db8817377cf/VEOFwd8TTe.lottie"
                        loop
                        autoplay
                        style={{ width: '32px', height: '32px', display: 'inline-block', verticalAlign: 'middle', marginRight: '10px' }}
                    />
                    AI Matches
                </h2>
                <p className="matches-subtitle">
                    {matches.length > 0
                        ? `Tìm thấy ${matches.length} kết quả phù hợp với bài đăng của bạn`
                        : 'Chưa có kết quả phù hợp. AI sẽ tự động quét mỗi giờ.'}
                </p>
            </div>

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
                <div className="matches-list">
                    {matches.map((match) => (
                        <div key={match.Match_id} className="match-card">
                            <div className="match-header">
                                <div className="match-score">
                                    <span className="score-badge">
                                        {Math.round((match.Confidence_score || 0) * 100)}% Match
                                    </span>
                                    <span className="match-date">
                                        {new Date(match.Matched_at).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>

                            <div className="match-content">
                                <div className="match-post-info">
                                    <h4>{match.Post?.Post_Title || 'Bài đăng'}</h4>
                                    <p className="post-type">
                                        {match.Post?.Post_type === 'lost' ? 'Đồ mất' : 'Đồ nhặt được'}
                                    </p>
                                    {match.Post?.Item_name && (
                                        <p className="item-name">{match.Post.Item_name}</p>
                                    )}
                                    {match.Your_Post && (
                                        <p className="your-post-ref">
                                            ↳ Khớp với: <strong>"{match.Your_Post.Post_Title}"</strong>
                                        </p>
                                    )}
                                </div>

                                <div className="match-actions">
                                    <button
                                        onClick={() => handleViewPost(match)}
                                        className="btn-view"
                                        title="Xem bài đăng"
                                    >
                                        Xem chi tiết
                                    </button>
                                    <button
                                        onClick={() => handleChatWithMatch(match)}
                                        className="btn-chat"
                                        title="Chat với người đăng"
                                    >
                                        Nhắn tin
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMatch(match.Match_id)}
                                        className="btn-delete"
                                        title="Xóa match này"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MatchesPage;
