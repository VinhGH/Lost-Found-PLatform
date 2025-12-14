import React, { useState, useEffect, useRef } from "react";
import "./ChatPage.css";
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import ChatContextBox from "./ChatContextBox";
import realApi from "../../services/realApi";

const ChatPage = ({ user, chatTarget, setActiveTab, posts = [], onOpenPostDetail, setProfileTargetUser }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [chatPostData, setChatPostData] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // State cho search
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
            timestamp: utcDate, // ✅ Thêm timestamp đầy đủ để so sánh ngày
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
      const response = await realApi.sendMessage(
        activeConversation.conversation_id,
        newMessage.trim()
      );

      if (response.success) {
        // Reload messages
        await loadMessages(activeConversation.conversation_id);
        setNewMessage("");

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
              .map((conv) => {
                const conversationName = getConversationName(conv);
                const conversationAvatar = getConversationAvatar(conv);
                const lastMessagePreview = getLastMessagePreview(conv);
                const postType = conv.lost_post_id ? 'lost' : 'found';

                return (
                  <div
                    key={conv.conversation_id}
                    className={`conversation-item ${activeConversation?.conversation_id === conv.conversation_id ? "active" : ""
                      }`}
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
                        <strong style={{ flex: 1, minWidth: 0 }}>{conversationName}</strong>
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
                      <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>
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
                    <span>Đang hoạt động</span>
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
                        className={`message ${msg.from === "Bạn" ? "own" : "other"}`}
                      >
                        <div className="message-content">
                          <p className="message-text">{msg.text}</p>
                          <span className="message-time">{msg.time}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="message-input">
                <div className="input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="message-text-input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
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
