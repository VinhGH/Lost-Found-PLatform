import React, { useState, useEffect, useRef } from "react";
import "./ChatPage.css";
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  DeleteForever as DeleteForeverIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import ChatContextBox from "./ChatContextBox";
import realApi from "../../services/realApi";
import { deleteMessage, sendReplyMessage } from "../../services/chatApiExtensions";


const ChatPage = ({ user, chatTarget, setActiveTab, posts = [], onOpenPostDetail, setProfileTargetUser }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation,] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [chatPostData, setChatPostData] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // State cho search sidebar
  const [messageSearchQuery, setMessageSearchQuery] = useState(""); // ✅ Search trong messages
  const [showMessageSearch, setShowMessageSearch] = useState(false); // ✅ Show/hide search input
  const [searchResults, setSearchResults] = useState([]); // ✅ Search results
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0); // ✅ Current result index
  const [replyingTo, setReplyingTo] = useState(null); // ✅ Message being replied to
  const [hoveredMessageId, setHoveredMessageId] = useState(null); // ✅ Currently hovered message
  const processingChatTarget = useRef(null);

  // ✅ Load conversations từ API khi component mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await realApi.getConversations();

      if (response.success && response.data) {
        const convs = response.data.data || response.data;
        // console.log("✅ Loaded conversations from API:", convs.length);
        setConversations(convs);
      } else {
        console.error("❌ Failed to load conversations:", response.error);
        if (showLoading) setConversations([]);
      }
    } catch (error) {
      console.error("❌ Error loading conversations:", error);
      if (showLoading) setConversations([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // 🔹 Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoreMenu && !event.target.closest('.more-menu-container')) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  // 🔹 Ngăn scroll body khi ở tab chat
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // ✅ Polling: Cập nhật danh sách chat mỗi 30 giây
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadConversations(false); // false = không show loading spinner
    }, 30000); // 30s thay vì 10s

    return () => clearInterval(intervalId);
  }, []);

  // ✅ Polling: Cập nhật tin nhắn mỗi 5 giây khi đang chat
  useEffect(() => {
    if (!activeConversation) return;

    const intervalId = setInterval(() => {
      loadMessages(activeConversation.conversation_id, false); // false = không reset messages
    }, 5000); // 5s thay vì 3s

    return () => clearInterval(intervalId);
  }, [activeConversation]);

  // ✅ Khi user bấm "Liên hệ ngay" → nhận chatTarget từ props
  useEffect(() => {
    if (chatTarget && chatTarget.postId && chatTarget.postType && chatTarget.postAuthorId) {
      handleChatTarget(chatTarget);
    }
  }, [chatTarget]);

  const handleChatTarget = async (target) => {
    // Prevent duplicate processing for the same target
    if (processingChatTarget.current === target.postId) {
      console.log("⏳ Chat target already processing:", target.postId);
      return;
    }

    try {
      processingChatTarget.current = target.postId;
      console.log("💬 Chat target received:", target);

      // Gọi API để tạo hoặc lấy conversation
      const response = await realApi.createOrGetConversationByPost(
        target.postId,
        target.postType,
        target.postAuthorId
      );

      if (response.success && response.data) {
        const conv = response.data.data || response.data;
        console.log("✅ Conversation ready:", conv);

        // Reload conversations để cập nhật danh sách
        await loadConversations();

        // Set active conversation
        setActiveConversation(conv);

        // Load messages
        await loadMessages(conv.conversation_id);

        // Set chat post data từ conversation
        const postData = extractPostDataFromConversation(conv, target.postType);
        setChatPostData(postData);
      } else {
        console.error("❌ Failed to create/get conversation:", response.error);
      }
    } catch (error) {
      console.error("❌ Error handling chat target:", error);
    } finally {
      processingChatTarget.current = null;
    }
  };

  const extractPostDataFromConversation = (conv, postType) => {
    if (!conv) return null;

    const post = postType === 'lost' ? conv.Lost_Post : conv.Found_Post;
    if (!post) return null;

    // Extract image
    let image = null;
    if (postType === 'lost' && post.Lost_Post_Images?.length > 0) {
      image = post.Lost_Post_Images[0]?.Lost_Images?.link_picture;
    } else if (postType === 'found' && post.Found_Post_Images?.length > 0) {
      image = post.Found_Post_Images[0]?.Found_Images?.link_picture;
    }

    return {
      id: post.lost_post_id || post.found_post_id,
      title: post.post_title,
      type: postType,
      description: post.description,
      author: post.Account?.user_name || post.Account?.name,
      image: image
    };
  };

  const loadMessages = async (conversationId, reset = true) => {
    try {
      const response = await realApi.getConversationMessages(conversationId);

      if (response.success && response.data) {
        const msgs = response.data.data || response.data;
        // console.log("✅ Loaded messages:", msgs.length);

        // Transform messages to match frontend format
        const transformedMessages = msgs.map(msg => {
          // Backend trả về timestamp không có 'Z', phải thêm để parse đúng UTC
          const utcTimestamp = msg.created_at.endsWith('Z') ? msg.created_at : msg.created_at + 'Z';
          const utcDate = new Date(utcTimestamp);
          const vnTime = utcDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Ho_Chi_Minh", // ✅ Múi giờ Việt Nam (UTC+7)
          });

          // Debug log
          console.log('🕐 Message time:', {
            original: msg.created_at,
            withZ: utcTimestamp,
            utcDate: utcDate.toISOString(),
            vnTime: vnTime
          });

          return {
            id: msg.message_id,
            from: msg.sender_id === user?.account_id ? "Bạn" : msg.Sender?.user_name || "User",
            text: msg.message,
            time: vnTime,
            timestamp: utcDate,
            isRead: msg.is_read || false,
            senderId: msg.sender_id,
            // ✅ THÊM FIELD NÀY
            repliedTo: msg.RepliedMessage ? {
              id: msg.RepliedMessage.message_id,
              from: msg.RepliedMessage.sender_id === user?.account_id ? "Bạn" : msg.RepliedMessage.Sender?.user_name || "User",
              text: msg.RepliedMessage.message
            } : null,
          };
        });

        setMessages(transformedMessages);
      } else {
        if (reset) setMessages([]);
      }
    } catch (error) {
      console.error("❌ Error loading messages:", error);
      if (reset) setMessages([]);
    }
  };

  // ✅ Helper function to format date for separator
  const formatDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare only dates
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
      return "Hôm nay";
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // ✅ Helper function to check if date changed between messages
  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true; // Show for first message

    const currentDate = new Date(currentMsg.timestamp);
    const previousDate = new Date(previousMsg.timestamp);

    // Compare only date part (ignore time)
    return (
      currentDate.getDate() !== previousDate.getDate() ||
      currentDate.getMonth() !== previousDate.getMonth() ||
      currentDate.getFullYear() !== previousDate.getFullYear()
    );
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    try {
      let response;

      // ✅ If replying to a message, use sendReplyMessage
      if (replyingTo) {
        response = await sendReplyMessage(
          activeConversation.conversation_id,
          newMessage.trim(),
          replyingTo.id
        );
      } else {
        // Normal message
        response = await realApi.sendMessage(
          activeConversation.conversation_id,
          newMessage.trim()
        );
      }
      if (response.success) {
        // Reload messages
        await loadMessages(activeConversation.conversation_id);
        setNewMessage("");
        setReplyingTo(null); // ✅ Clear reply state
        // ❌ REMOVED: Không cần reload conversations ngay lập tức
        // Polling sẽ tự động cập nhật sau 30s
      } else {
        console.error("❌ Failed to send message:", response.error);
        alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("Đã xảy ra lỗi khi gửi tin nhắn.");
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;

    const conversationName = getConversationName(activeConversation);
    if (window.confirm(`Bạn có chắc muốn xóa cuộc trò chuyện với ${conversationName}?`)) {
      try {
        const response = await realApi.deleteConversation(activeConversation.conversation_id);

        if (response.success) {
          console.log("✅ Conversation deleted");

          // Reload conversations
          await loadConversations();

          // Clear active conversation
          setActiveConversation(null);
          setMessages([]);
          setChatPostData(null);
          setShowMoreMenu(false);
        } else {
          console.error("❌ Failed to delete conversation:", response.error);
          alert("Không thể xóa cuộc trò chuyện. Vui lòng thử lại.");
        }
      } catch (error) {
        console.error("❌ Error deleting conversation:", error);
        alert("Đã xảy ra lỗi khi xóa cuộc trò chuyện.");
      }
    }
  };

  const handleViewProfile = () => {
    if (!activeConversation || !setActiveTab) return;

    // Lấy account_id của user đang chat (không phải current user)
    const otherParticipant = activeConversation.participants?.find(
      p => p.account_id !== user?.account_id
    );

    if (otherParticipant?.account_id) {
      // Set target user để UserProfile hiển thị
      if (setProfileTargetUser) {
        // Construct user object from participant data
        const targetUser = {
          ...otherParticipant.Account,
          account_id: otherParticipant.account_id,
          name: otherParticipant.Account?.user_name || otherParticipant.Account?.name || "User",
          email: otherParticipant.Account?.email,
          avatar: otherParticipant.Account?.avatar,
          phone: otherParticipant.Account?.phone_number || otherParticipant.Account?.phone,
          address: otherParticipant.Account?.address
        };
        setProfileTargetUser(targetUser);
      }

      // Chuyển đến tab profile
      setActiveTab("profile");
    }
  };

  const handleContextBoxClick = (postId, postType) => {
    if (postType === "lost") {
      setActiveTab("lost");
    } else if (postType === "found") {
      setActiveTab("found");
    }

    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.transition = "box-shadow 0.3s";
        el.style.boxShadow = "0 0 0 3px rgba(25, 118, 210, 0.3)";
        setTimeout(() => {
          el.style.boxShadow = "";
        }, 2000);
      }
    }, 300);
  };

  const handleViewPost = (postId, postType, e) => {
    e.stopPropagation();
    const post = posts.find(p => p.id === postId);
    if (post && onOpenPostDetail) {
      onOpenPostDetail(post);
    }
  };

  const handleConversationClick = async (conv) => {
    setActiveConversation(conv);

    // Load messages
    await loadMessages(conv.conversation_id);

    // ✅ Mark messages as read when opening conversation
    try {
      await realApi.markMessagesAsRead(conv.conversation_id);
      console.log("✓✓ Messages marked as read");
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }

    // Set chat post data
    const postType = conv.lost_post_id ? 'lost' : 'found';
    const postData = extractPostDataFromConversation(conv, postType);
    setChatPostData(postData);
  };

  // Helper function to get conversation display name
  const getConversationName = (conv) => {
    if (!conv || !conv.participants) return "Unknown";

    // Find the other participant (not current user)
    const otherParticipant = conv.participants.find(
      p => p.account_id !== user?.account_id
    );

    return otherParticipant?.Account?.user_name || otherParticipant?.Account?.name || "User";
  };

  // Helper function to get conversation avatar
  const getConversationAvatar = (conv) => {
    if (!conv || !conv.participants) return "/img/default-avatar.png";

    const otherParticipant = conv.participants.find(
      p => p.account_id !== user?.account_id
    );

    return otherParticipant?.Account?.avatar || "/img/default-avatar.png";
  };

  // Helper function to get last message preview
  const getLastMessagePreview = (conv) => {
    if (conv.last_message) {
      return conv.last_message.message || "Chưa có tin nhắn";
    }
    return "Chưa có tin nhắn";
  };
  // ✅ Handler: Reply to message
  const handleReplyMessage = (msg) => {
    setReplyingTo(msg);
    setHoveredMessageId(null);
    setTimeout(() => {
      const textarea = document.querySelector('.message-text-input');
      if (textarea) textarea.focus();
    }, 100);
  };
  // ✅ Handler: Delete message
  const handleDeleteMessage = async (msg) => {
    if (!window.confirm("Bạn có chắc muốn thu hồi tin nhắn này?")) return;

    try {
      const response = await deleteMessage(activeConversation.conversation_id, msg.id);

      if (response.success) {
        console.log("✅ Message deleted");
        // Hide message immediately with animation
        const messageEl = document.getElementById(`msg-${msg.id}`);
        if (messageEl) {
          messageEl.style.opacity = '0';
          messageEl.style.transform = 'scale(0.8)';
          messageEl.style.transition = 'all 0.3s ease';
          setTimeout(() => {
            messageEl.style.display = 'none';
          }, 300);
        }
        setHoveredMessageId(null);
      } else {
        alert(response.error || "Không thể thu hồi tin nhắn");
      }
    } catch (error) {
      alert("Đã xảy ra lỗi khi thu hồi tin nhắn");
    }
  };
  // ✅ Handler: Forward message
  const handleForwardMessage = (msg) => {
    navigator.clipboard.writeText(msg.text).then(() => {
      alert(`Đã sao chép: "${msg.text.substring(0, 50)}..."`);
      setHoveredMessageId(null);
    }).catch(() => alert("Không thể sao chép"));
  };
  // ✅ Handler: Cancel reply
  const cancelReply = () => setReplyingTo(null);
  // ✅ Handler: Scroll to message
  const handleScrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('message-highlight');
      setTimeout(() => el.classList.remove('message-highlight'), 2000);
    }
  };
  if (isLoading)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Đang tải...</p>;

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Sidebar */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>
              <ChatIcon style={{ fontSize: "20px", marginRight: "6px" }} />
              Tin nhắn
            </h2>
            <input
              type="text"
              className="sidebar-search"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="conversations-list">
            {conversations
              .filter((conv) => {
                if (!searchQuery.trim()) return true;
                const conversationName = getConversationName(conv);
                return conversationName.toLowerCase().includes(searchQuery.toLowerCase());
              })
              // ✅ Sort by last message time (newest first)
              .sort((a, b) => {
                const timeA = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
                const timeB = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
                return timeB - timeA; // Descending order (newest first)
              })
              .map((conv) => {
                const conversationName = getConversationName(conv);
                const conversationAvatar = getConversationAvatar(conv);
                const lastMessagePreview = getLastMessagePreview(conv);
                const postType = conv.lost_post_id ? 'lost' : 'found';

                // ✅ Check if conversation has unread messages
                const hasUnread = conv.last_message &&
                  !conv.last_message.is_read &&
                  conv.last_message.sender_id !== user?.account_id;

                return (
                  <div
                    key={conv.conversation_id}
                    className={`conversation-item ${activeConversation?.conversation_id === conv.conversation_id ? "active" : ""} ${hasUnread ? "unread" : ""}`}
                    onClick={() => handleConversationClick(conv)}
                  >
                    <img
                      src={conversationAvatar}
                      alt={conversationName}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        marginRight: "12px",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <strong style={{
                          flex: 1,
                          minWidth: 0,
                          fontWeight: hasUnread ? 700 : 600, // ✅ Bold if unread
                          color: hasUnread ? '#000' : 'inherit' // ✅ Darker if unread
                        }}>
                          {conversationName}
                        </strong>
                        {/* ✅ Unread badge */}
                        {hasUnread && (
                          <span className="conversation-unread-badge">●</span>
                        )}
                        <span
                          className={`conversation-post-badge conversation-post-badge-${postType}`}
                          style={{
                            fontSize: "10px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {postType === "found" ? "Nhặt được" : "Tìm đồ"}
                        </span>
                      </div>
                      <p style={{
                        fontSize: "12px",
                        color: hasUnread ? "#333" : "#555", // ✅ Darker if unread
                        margin: 0,
                        fontWeight: hasUnread ? 600 : 400, // ✅ Semi-bold if unread
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        wordBreak: "break-word",
                        whiteSpace: "normal"
                      }}>
                        {lastMessagePreview}
                      </p>
                    </div>
                  </div>
                );
              })}
            {conversations.length === 0 && (
              <p style={{ textAlign: "center", color: "#999", marginTop: "20px" }}>
                Chưa có cuộc trò chuyện nào
              </p>
            )}
          </div>
        </div>

        {/* Chat box */}
        <div className="chat-main">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <img
                    src={getConversationAvatar(activeConversation)}
                    alt=""
                  />
                  <div>
                    <h3>{getConversationName(activeConversation)}</h3>
                  </div>
                </div>
                <div className="chat-actions">
                  <button
                    className="btn-action"
                    onClick={handleViewProfile}
                    title="Xem thông tin cá nhân"
                  >
                    <PersonIcon />
                  </button>
                  <div className="more-menu-container">
                    <button
                      className="btn-action"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      title="Tùy chọn"
                    >
                      <MoreVertIcon />
                    </button>
                    {showMoreMenu && (
                      <div className="more-menu-dropdown">
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            setShowMessageSearch(!showMessageSearch);
                            setShowMoreMenu(false);
                            if (!showMessageSearch) {
                              setMessageSearchQuery("");
                              setSearchResults([]);
                            }
                          }}
                        >
                          <SearchIcon style={{ fontSize: "18px", marginRight: "8px" }} />
                          Tìm kiếm tin nhắn
                        </button>
                        <button
                          className="dropdown-item delete"
                          onClick={handleDeleteConversation}
                        >
                          <DeleteIcon style={{ fontSize: "18px", marginRight: "8px" }} />
                          Xóa cuộc trò chuyện
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ✅ Message Search Bar */}
              {showMessageSearch && (
                <div className="message-search-bar">
                  <SearchIcon style={{ fontSize: "18px", color: "#666" }} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tin nhắn..."
                    value={messageSearchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setMessageSearchQuery(query);
                      if (query.trim()) {
                        const results = messages.filter(msg =>
                          msg.text.toLowerCase().includes(query.toLowerCase())
                        );
                        setSearchResults(results);
                        setCurrentSearchIndex(0);
                        // Scroll to first result
                        if (results.length > 0) {
                          setTimeout(() => {
                            const firstResult = document.getElementById(`msg-${results[0].id}`);
                            if (firstResult) {
                              firstResult.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }, 100);
                        }
                      } else {
                        setSearchResults([]);
                      }
                    }}
                    className="message-search-input"
                  />
                  {searchResults.length > 0 && (
                    <div className="search-results-info">
                      <span>{currentSearchIndex + 1}/{searchResults.length}</span>
                      <button
                        onClick={() => {
                          const newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
                          setCurrentSearchIndex(newIndex);
                          const msg = document.getElementById(`msg-${searchResults[newIndex].id}`);
                          if (msg) msg.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="search-nav-btn"
                      >
                        <ArrowUpIcon style={{ fontSize: "16px" }} />
                      </button>
                      <button
                        onClick={() => {
                          const newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
                          setCurrentSearchIndex(newIndex);
                          const msg = document.getElementById(`msg-${searchResults[newIndex].id}`);
                          if (msg) msg.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="search-nav-btn"
                      >
                        <ArrowDownIcon style={{ fontSize: "16px" }} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowMessageSearch(false);
                      setMessageSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="search-close-btn"
                  >
                    <CloseIcon style={{ fontSize: "18px" }} />
                  </button>
                </div>
              )}

              {/* Chat Context Box - Hiển thị thông tin bài đăng */}
              {chatPostData && (
                <ChatContextBox
                  post={chatPostData}
                  onViewPost={handleViewPost}
                  onBoxClick={handleContextBoxClick}
                />
              )}

              <div className="messages-container">
                <div className="messages-list">
                  {messages.map((msg, i) => (
                    <React.Fragment key={msg.id || i}>
                      {/* Date Separator */}
                      {shouldShowDateSeparator(msg, messages[i - 1]) && (
                        <div className="date-separator">
                          <span>{formatDateSeparator(msg.timestamp)}</span>
                        </div>
                      )}

                      {/* Message */}
                      <div
                        id={`msg-${msg.id}`}
                        className={`message ${msg.from === "Bạn" ? "own" : "other"} ${searchResults.some(r => r.id === msg.id) ? "search-highlight" : ""
                          } ${searchResults[currentSearchIndex]?.id === msg.id ? "search-active" : ""
                          }`}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        <div className="message-content">
                          {/* Replied Message - INSIDE bubble */}
                          {msg.repliedTo && (
                            <div className="replied-message-ref" onClick={() => handleScrollToMessage(msg.repliedTo.id)}>
                              <ReplyIcon style={{ fontSize: "14px" }} />
                              <div className="replied-message-info">
                                <strong>{msg.repliedTo.from}</strong>
                                <p>{msg.repliedTo.text}</p>
                              </div>
                            </div>
                          )}

                          <p className="message-text">{msg.text}</p>
                          <div className="message-footer">
                            <span className="message-time">{msg.time}</span>
                            {/* ✅ Read receipts for sent messages */}
                            {msg.senderId === user?.account_id && (
                              <span className={`message-status ${msg.isRead ? 'read' : 'sent'}`}>
                                {msg.isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ✅ Message Actions on Hover */}
                        {hoveredMessageId === msg.id && (
                          <div className={`message-actions ${msg.from === "Bạn" ? "own-actions" : "other-actions"}`}>
                            <button
                              className="message-action-btn"
                              onClick={() => handleReplyMessage(msg)}
                              title="Trả lời"
                            >
                              <ReplyIcon style={{ fontSize: "16px" }} />
                            </button>
                            <button
                              className="message-action-btn"
                              onClick={() => handleForwardMessage(msg)}
                              title="Chuyển tiếp"
                            >
                              <ForwardIcon style={{ fontSize: "16px" }} />
                            </button>
                            {msg.senderId === user?.account_id && (
                              <button
                                className="message-action-btn delete-btn"
                                onClick={() => handleDeleteMessage(msg)}
                                title="Thu hồi"
                              >
                                <DeleteForeverIcon style={{ fontSize: "16px" }} />
                              </button>
                            )}
                            <button
                              className="message-action-btn"
                              title="Thêm"
                            >
                              <MoreHorizIcon style={{ fontSize: "16px" }} />
                            </button>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {/* ✅ Reply Preview */}
              {replyingTo && (
                <div className="reply-preview">
                  <div className="reply-preview-content">
                    <ReplyIcon style={{ fontSize: "16px", color: "#667eea" }} />
                    <div className="reply-preview-info">
                      <strong>Trả lời {replyingTo.from}</strong>
                      <p>{replyingTo.text}</p>
                    </div>
                  </div>
                  <button className="reply-preview-close" onClick={cancelReply}>
                    <CloseIcon style={{ fontSize: "18px" }} />
                  </button>
                </div>
              )}
              <div className="message-input">
                <div className="input-container">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="message-text-input"
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onInput={(e) => {
                      // Auto-resize textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="btn-send"
                    disabled={!newMessage.trim()}
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <ChatIcon style={{ fontSize: "48px", color: "#aaa" }} />
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>Hoặc nhấn "Liên hệ ngay" ở bài viết để bắt đầu chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
