import React, { useState, useEffect } from "react";
import "./ChatPage.css";
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const ChatPage = ({ user, chatTarget, setActiveTab }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // ✅ Load conversations từ localStorage khi component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chatConversations");
      if (saved) {
        const parsedConversations = JSON.parse(saved);
        if (Array.isArray(parsedConversations)) {
          setConversations(parsedConversations);
          console.log("✅ Đã load", parsedConversations.length, "cuộc trò chuyện từ localStorage");
          
          // Load active conversation nếu có
          const savedActiveId = localStorage.getItem("chatActiveConversationId");
          if (savedActiveId) {
            const active = parsedConversations.find(c => c.id === parseInt(savedActiveId));
            if (active) {
              setActiveConversation(active);
              setMessages(active.messages || []);
            }
          }
        } else {
          // Nếu không có dữ liệu hợp lệ, khởi tạo với mock data
          initializeMockData();
        }
      } else {
        // Nếu chưa có dữ liệu, khởi tạo với mock data
        initializeMockData();
      }
    } catch (error) {
      console.error("❌ Lỗi khi load conversations từ localStorage:", error);
      initializeMockData();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // ✅ Hàm khởi tạo mock data
  const initializeMockData = () => {
    const mockConversations = [
      {
        id: 1,
        user: { id: 2, name: "Nguyễn Văn A", avatar: "/img/avatar1.jpg", online: true },
        lastMessage: "Xin chào, tôi có thể nhận lại ví được không?",
        lastMessageTime: "2 phút trước",
        messages: [
          { from: "Nguyễn Văn A", text: "Xin chào, tôi có thể nhận lại ví được không?", time: "09:15" },
          { from: "Bạn", text: "Vâng, bạn có thể qua phòng bảo vệ nhé.", time: "09:16" },
        ],
      },
      {
        id: 2,
        user: { id: 3, name: "Trần Thị B", avatar: "/img/avatar2.jpg", online: false },
        lastMessage: "Cảm ơn bạn đã liên hệ!",
        lastMessageTime: "1 giờ trước",
        messages: [
          { from: "Trần Thị B", text: "Mình có nhặt được điện thoại màu xanh.", time: "08:00" },
          { from: "Bạn", text: "Rất tốt, cảm ơn bạn đã thông báo!", time: "08:05" },
        ],
      },
    ];
    setConversations(mockConversations);
  };

  // ✅ Lưu conversations vào localStorage khi có thay đổi
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("chatConversations", JSON.stringify(conversations));
        if (activeConversation) {
          localStorage.setItem("chatActiveConversationId", activeConversation.id.toString());
        }
        console.log("💾 Đã lưu conversations vào localStorage");
      } catch (error) {
        console.error("❌ Lỗi khi lưu conversations vào localStorage:", error);
      }
    }
  }, [conversations, activeConversation, isInitialized]);

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
    // Ngăn scroll body
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Khôi phục scroll khi rời khỏi chat
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // ✅ Khi user bấm "Liên hệ ngay" → nhận chatTarget từ props
  useEffect(() => {
    if (chatTarget && isInitialized) {
      const existing = conversations.find(
        (conv) => conv.user.name === chatTarget
      );

      if (existing) {
        setActiveConversation(existing);
        setMessages(existing.messages || []);
        localStorage.setItem("chatActiveConversationId", existing.id.toString());
      } else {
        // nếu chưa có cuộc trò chuyện → tạo mới
        const newConv = {
          id: Date.now(),
          user: { id: Date.now(), name: chatTarget, avatar: "/img/default-avatar.png", online: true },
          lastMessage: "",
          lastMessageTime: "Vừa xong",
          messages: [],
        };
        setConversations((prev) => [...prev, newConv]);
        setActiveConversation(newConv);
        setMessages([]);
        localStorage.setItem("chatActiveConversationId", newConv.id.toString());
      }
    }
  }, [chatTarget, conversations, isInitialized]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const message = {
      from: "Bạn",
      text: newMessage,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);

    const updatedConv = {
      ...activeConversation,
      lastMessage: newMessage,
      lastMessageTime: "Vừa xong",
      messages: updatedMessages,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    );
    setActiveConversation(updatedConv);
    setNewMessage("");
    // Không cần lưu trực tiếp, useEffect sẽ tự động lưu khi conversations thay đổi
  };

  // 🔹 Xóa cuộc trò chuyện
  const handleDeleteConversation = () => {
    if (!activeConversation) return;
    
    if (window.confirm(`Bạn có chắc muốn xóa cuộc trò chuyện với ${activeConversation.user.name}?`)) {
      const updatedConversations = conversations.filter(
        (c) => c.id !== activeConversation.id
      );
      setConversations(updatedConversations);
      setActiveConversation(null);
      setMessages([]);
      localStorage.removeItem("chatActiveConversationId");
      setShowMoreMenu(false);
    }
  };

  // 🔹 Xem thông tin cá nhân
  const handleViewProfile = () => {
    if (!activeConversation || !setActiveTab) return;
    // Chuyển tới tab profile
    setActiveTab("profile");
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
          </div>
          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${
                  activeConversation?.id === conv.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveConversation(conv);
                  setMessages(conv.messages || []);
                  // Lưu active conversation ID
                  localStorage.setItem("chatActiveConversationId", conv.id.toString());
                }}
              >
                <img
                  src={conv.user.avatar}
                  alt={conv.user.name}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    marginRight: "10px",
                  }}
                />
                <div>
                  <strong>{conv.user.name}</strong>
                  <p style={{ fontSize: "12px", color: "#555" }}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat box */}
        <div className="chat-main">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <img src={activeConversation.user.avatar} alt="" />
                  <div>
                    <h3>{activeConversation.user.name}</h3>
                    <span>
                      {activeConversation.user.online
                        ? "Đang hoạt động"
                        : "Ngoại tuyến"}
                    </span>
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

              <div className="messages-container">
                <div className="messages-list">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`message ${
                        msg.from === "Bạn" ? "own" : "other"
                      }`}
                    >
                      <div className="message-content">
                        <p className="message-text">{msg.text}</p>
                        <span className="message-time">{msg.time}</span>
                      </div>
                    </div>
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
              <p>Hoặc nhấn “Liên hệ ngay” ở bài viết để bắt đầu chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
