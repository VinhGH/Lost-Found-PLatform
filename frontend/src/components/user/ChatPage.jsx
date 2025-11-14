import React, { useState, useEffect } from "react";
import "./ChatPage.css";
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import ChatContextBox from "./ChatContextBox";

const ChatPage = ({ user, chatTarget, setActiveTab, posts = [], onOpenPostDetail }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [chatPostData, setChatPostData] = useState(null);

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
        // Lưu chatPostData vào activeConversation trước khi lưu conversations
        if (activeConversation && chatPostData) {
          const updatedConv = { ...activeConversation, chatPostData };
          setConversations((prev) =>
            prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
          );
        }
        localStorage.setItem("chatConversations", JSON.stringify(conversations));
        if (activeConversation) {
          localStorage.setItem("chatActiveConversationId", activeConversation.id.toString());
        }
        console.log("💾 Đã lưu conversations vào localStorage");
      } catch (error) {
        console.error("❌ Lỗi khi lưu conversations vào localStorage:", error);
      }
    }
  }, [conversations, activeConversation, isInitialized, chatPostData]);

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

  // ✅ Lắng nghe thay đổi từ localStorage để cập nhật conversations và chatPostData
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'chatConversations') {
        console.log('🔄 Phát hiện thay đổi trong "chatConversations", đang tải lại...');
        try {
          const saved = localStorage.getItem("chatConversations");
          if (saved) {
            const parsedConversations = JSON.parse(saved);
            if (Array.isArray(parsedConversations)) {
              setConversations(parsedConversations);
              
              // Cập nhật lại active conversation nếu nó còn tồn tại
              if (activeConversation) {
                const updatedActive = parsedConversations.find(c => c.id === activeConversation.id);
                if (updatedActive) {
                  setActiveConversation(updatedActive);
                  setMessages(updatedActive.messages || []);
                } else {
                  // Nếu active conversation không còn, reset
                  setActiveConversation(null);
                  setMessages([]);
                }
              }
            }
          }
        } catch (error) {
          console.error("❌ Lỗi khi tải lại conversations từ storage event:", error);
        }
      } else if (event.key === 'chatPostData') {
        // ✅ Phát hiện thay đổi trong chatPostData (khi bấm "Liên hệ ngay" từ tab khác)
        console.log('🔄 Phát hiện thay đổi trong "chatPostData", đang cập nhật...');
        if (activeConversation) {
          try {
            const savedPostData = localStorage.getItem("chatPostData");
            if (savedPostData) {
              const postData = JSON.parse(savedPostData);
              // Chỉ cập nhật nếu khớp với conversation hiện tại
              if (postData.author === activeConversation.user.name) {
                setChatPostData(postData);
                // Cập nhật vào conversation để đồng bộ
                const updatedConv = { ...activeConversation, chatPostData: postData };
                setConversations((prev) =>
                  prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
                );
                console.log("✅ Đã cập nhật chatPostData từ storage event:", postData);
              }
            }
          } catch (error) {
            console.error("❌ Lỗi khi cập nhật chatPostData từ storage event:", error);
          }
        }
      }
    };

    // ✅ Lắng nghe cả storage event (từ tab khác) và custom event (từ cùng tab)
    window.addEventListener('storage', handleStorageChange);
    
    // ✅ Tạo custom event listener để phát hiện thay đổi từ cùng tab
    const handleCustomStorageChange = () => {
      if (activeConversation) {
        try {
          const savedPostData = localStorage.getItem("chatPostData");
          if (savedPostData) {
            const postData = JSON.parse(savedPostData);
            if (postData.author === activeConversation.user.name) {
              setChatPostData(postData);
              const updatedConv = { ...activeConversation, chatPostData: postData };
              setConversations((prev) =>
                prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
              );
              console.log("✅ Đã cập nhật chatPostData từ custom event:", postData);
            }
          }
        } catch (error) {
          console.error("❌ Lỗi khi cập nhật chatPostData từ custom event:", error);
        }
      }
    };
    
    // ✅ Lắng nghe custom event khi localStorage thay đổi từ cùng tab
    window.addEventListener('chatPostDataChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chatPostDataChanged', handleCustomStorageChange);
    };
  }, [activeConversation]); // Phụ thuộc vào activeConversation để cập nhật đúng

  // ✅ Load chatPostData từ localStorage khi component mount hoặc khi activeConversation thay đổi
  useEffect(() => {
    if (isInitialized && activeConversation) {
      // ✅ Ưu tiên load từ localStorage mới nhất (khi bấm "Liên hệ ngay" từ tab khác)
      try {
        const savedPostData = localStorage.getItem("chatPostData");
        if (savedPostData) {
          const postData = JSON.parse(savedPostData);
          // Chỉ load nếu khớp với conversation hiện tại
          if (postData.author === activeConversation.user.name) {
            setChatPostData(postData);
            // Cập nhật vào conversation để đồng bộ
            const updatedConv = { ...activeConversation, chatPostData: postData };
            setConversations((prev) =>
              prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
            );
            console.log("✅ Đã load chatPostData mới từ localStorage:", postData);
            return; // Dừng lại, không cần fallback
          }
        }
      } catch (error) {
        console.error("❌ Lỗi khi load chatPostData từ localStorage:", error);
      }
      
      // Fallback: load từ conversation nếu không có trong localStorage hoặc không khớp
      if (activeConversation.chatPostData) {
        setChatPostData(activeConversation.chatPostData);
        console.log("✅ Đã load chatPostData từ conversation:", activeConversation.chatPostData);
      }
    }
  }, [isInitialized, activeConversation?.id, activeConversation?.user?.name]);

  // ✅ Fetch lại dữ liệu bài đăng từ posts để đảm bảo đồng bộ - Tự động cập nhật khi bài đăng được chỉnh sửa
  useEffect(() => {
    if (chatPostData && chatPostData.id && posts.length > 0) {
      const freshPost = posts.find(p => p.id === chatPostData.id);
      if (freshPost) {
        // So sánh để phát hiện thay đổi
        const hasChanged = 
          freshPost.title !== chatPostData.title ||
          freshPost.image !== chatPostData.image ||
          freshPost.description !== chatPostData.description ||
          freshPost.category !== chatPostData.category ||
          freshPost.location !== chatPostData.location ||
          freshPost.type !== chatPostData.type;
        
        if (hasChanged) {
          // Cập nhật với dữ liệu mới nhất từ posts
          const updatedPostData = {
            id: freshPost.id,
            title: freshPost.title,
            image: freshPost.image,
            type: freshPost.type,
            category: freshPost.category,
            location: freshPost.location,
            author: freshPost.author,
            description: freshPost.description,
            createdAt: freshPost.createdAt || freshPost.id,
            updatedAt: freshPost.updatedAt || freshPost.createdAt || freshPost.id
          };
          setChatPostData(updatedPostData);
          // Cập nhật localStorage với dữ liệu mới
          localStorage.setItem("chatPostData", JSON.stringify(updatedPostData));
          console.log("🔄 Đã tự động cập nhật chatPostData với dữ liệu mới nhất:", updatedPostData);
        }
      } else {
        // Nếu không tìm thấy bài đăng trong posts, có thể đã bị xóa
        console.warn("⚠️ Không tìm thấy bài đăng với id:", chatPostData.id);
        // Giữ nguyên dữ liệu cũ để hiển thị, nhưng có thể hiển thị cảnh báo
      }
    }
  }, [posts, chatPostData?.id]); // Tự động chạy lại khi posts thay đổi (khi bài đăng được chỉnh sửa)

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
        // ✅ Ưu tiên load chatPostData mới nhất từ localStorage (khi bấm "Liên hệ ngay" từ tab khác)
        try {
          const savedPostData = localStorage.getItem("chatPostData");
          if (savedPostData) {
            const postData = JSON.parse(savedPostData);
            // Chỉ cập nhật nếu khớp author và có dữ liệu mới
            if (postData.author === chatTarget) {
              setChatPostData(postData);
              // Cập nhật vào conversation để đồng bộ
              const updatedConv = { ...existing, chatPostData: postData };
              setConversations((prev) =>
                prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
              );
              console.log("✅ Đã cập nhật chatPostData mới từ localStorage:", postData);
            } else if (existing.chatPostData) {
              // Nếu không khớp author, giữ nguyên dữ liệu cũ từ conversation
              setChatPostData(existing.chatPostData);
            }
          } else if (existing.chatPostData) {
            // Nếu không có trong localStorage, dùng dữ liệu từ conversation
            setChatPostData(existing.chatPostData);
          }
        } catch (error) {
          console.error("❌ Lỗi khi load chatPostData:", error);
          // Fallback: dùng dữ liệu từ conversation nếu có
          if (existing.chatPostData) {
            setChatPostData(existing.chatPostData);
          }
        }
      } else {
        // nếu chưa có cuộc trò chuyện → tạo mới
        // Kiểm tra và lưu chatPostData vào conversation mới
        let newChatPostData = null;
        try {
          const savedPostData = localStorage.getItem("chatPostData");
          if (savedPostData) {
            const postData = JSON.parse(savedPostData);
            if (postData.author === chatTarget) {
              newChatPostData = postData;
            }
          }
        } catch (error) {
          console.error("❌ Lỗi khi load chatPostData:", error);
        }

        const newConv = {
          id: Date.now(),
          user: { id: Date.now(), name: chatTarget, avatar: "/img/default-avatar.png", online: true },
          lastMessage: "",
          lastMessageTime: "Vừa xong",
          messages: [],
          chatPostData: newChatPostData, // Lưu chatPostData vào conversation
        };
        setConversations((prev) => [...prev, newConv]);
        setActiveConversation(newConv);
        setMessages([]);
        localStorage.setItem("chatActiveConversationId", newConv.id.toString());
        if (newChatPostData) {
          setChatPostData(newChatPostData);
        }
      }
    }
  }, [chatTarget, conversations, isInitialized]);

  // 🔹 Xử lý khi người dùng click vào ChatContextBox (scroll đến bài đăng)
  const handleContextBoxClick = (postId, postType) => {
    // Chuyển sang tab tương ứng
    if (postType === "lost") {
      setActiveTab("lost");
    } else if (postType === "found") {
      setActiveTab("found");
    }
    // Scroll đến bài đăng sau khi tab render
    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight bài đăng
        el.style.transition = "box-shadow 0.3s";
        el.style.boxShadow = "0 0 0 3px rgba(25, 118, 210, 0.3)";
        setTimeout(() => {
          el.style.boxShadow = "";
        }, 2000);
      }
    }, 300);
  };

  // 🔹 Xử lý khi người dùng click "Xem lại bài đăng" trong ChatContextBox (mở popup)
  const handleViewPost = (postId, postType, e) => {
    e.stopPropagation(); // Ngăn event bubble lên ChatContextBox
    // Tìm bài đăng trong posts
    const post = posts.find(p => p.id === postId);
    if (post && onOpenPostDetail) {
      // Mở popup "Xem chi tiết" trực tiếp
      // KHÔNG xóa chatPostData - giữ nguyên để ChatContextBox vẫn hiển thị sau khi đóng popup
      onOpenPostDetail(post);
    }
  };

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
          chatPostData: activeConversation.chatPostData || chatPostData, // Giữ chatPostData
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
                  // Load lại chatPostData từ conversation nếu có
                  if (conv.chatPostData) {
                    setChatPostData(conv.chatPostData);
                    localStorage.setItem("chatPostData", JSON.stringify(conv.chatPostData));
                  } else {
                    // Nếu conversation không có chatPostData, kiểm tra localStorage
                    try {
                      const savedPostData = localStorage.getItem("chatPostData");
                      if (savedPostData) {
                        const postData = JSON.parse(savedPostData);
                        // Chỉ load nếu postData thuộc về conversation này (dựa vào author)
                        if (postData.author === conv.user.name) {
                          setChatPostData(postData);
                          // Lưu vào conversation
                          const updatedConv = { ...conv, chatPostData: postData };
                          setConversations((prev) =>
                            prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
                          );
                        } else {
                          // Nếu không khớp, xóa chatPostData
                          setChatPostData(null);
                          localStorage.removeItem("chatPostData");
                        }
                      } else {
                        setChatPostData(null);
                      }
                    } catch (error) {
                      console.error("❌ Lỗi khi load chatPostData:", error);
                      setChatPostData(null);
                    }
                  }
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong style={{ flex: 1, minWidth: 0 }}>{conv.user.name}</strong>
                    {conv.chatPostData && (
                      <span
                        className={`conversation-post-badge conversation-post-badge-${conv.chatPostData.type === "found" ? "found" : "lost"}`}
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {conv.chatPostData.type === "found" ? "Nhặt được" : "Tìm đồ"}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>
                    {conv.lastMessage || "Chưa có tin nhắn"}
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
              <p>Hoặc nhấn “Liên hệ ngay” ở bài viết để bắt đầu chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
