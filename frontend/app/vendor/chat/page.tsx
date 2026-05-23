"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, User, MessageCircle, Bot } from "lucide-react";
import api from "@/lib/axios";
import { useNotificationStore } from "@/store/useNotificationStore";

export default function VendorChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [autoReply, setAutoReply] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const chatMessagesStore = useNotificationStore((s) => s.chatMessages);
  const pushChatMessage = useNotificationStore((s) => s.pushChatMessage);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession, chatMessagesStore]);

  // Load danh sách chat sessions của vendor
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await api.get("/chat/vendor/sessions");
        setSessions(res.data);
      } catch (error) {
        console.error("Failed to load sessions", error);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();

    const fetchShopInfo = async () => {
      try {
        const res = await api.get("/shops/my");
        setShopId(res.data.id);
        setAutoReply(res.data.ai_auto_respond);
      } catch (error) {
        console.error("Failed to load shop info", error);
      }
    };
    fetchShopInfo();
  }, []);

  // Lấy chi tiết tin nhắn khi chọn 1 session
  const selectSession = async (session: any) => {
    setActiveSession(session);
    try {
      const res = await api.get(`/chat/sessions/${session.id}/messages`);
      if (res.data) {
        res.data.forEach((m: any) => pushChatMessage(session.id, m));
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeSession) return;

    const messageText = text;
    setText("");
    const sessionId = activeSession.id;

    try {
      const res = await api.post(`/chat/vendor/sessions/${sessionId}/messages`, {
        message_text: messageText,
      });
      if (res.data.message) {
        pushChatMessage(sessionId, res.data.message);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      setText(messageText);
    }
  };

  const toggleAutoReply = async () => {
    if (!shopId || isUpdating) return;
    setIsUpdating(true);
    try {
      const newStatus = !autoReply;
      await api.patch(`/shops/${shopId}`, { ai_auto_respond: newStatus });
      setAutoReply(newStatus);
    } catch (error) {
      console.error("Failed to toggle auto reply", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentMessages = activeSession ? chatMessagesStore[activeSession.id] || [] : [];

  return (
    <div className="h-[calc(100vh-80px)] flex bg-[#12101A] overflow-hidden rounded-2xl border border-white/10 mt-6 mx-6 mb-6 shadow-2xl shadow-black/50">
      {/* Sidebar: Danh sách chat */}
      <div className="w-1/3 border-r border-white/10 bg-[#181622] flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Tin nhắn từ khách hàng</h2>
            {/* Auto Reply Toggle */}
            <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10">
              <Bot size={14} className={autoReply ? "text-violet-400" : "text-gray-500"} />
              <span className="text-xs font-medium text-gray-300 mr-1">AI Trả lời</span>
              <button
                onClick={toggleAutoReply}
                disabled={isUpdating}
                className={`w-8 h-4 rounded-full relative transition-colors ${autoReply ? 'bg-violet-600' : 'bg-gray-600'} disabled:opacity-50`}
              >
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoReply ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              className="w-full bg-[#12101A] border border-white/10 text-white rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Chưa có tin nhắn nào</div>
          ) : (
            [...sessions]
              .sort((a, b) => {
                const liveA = chatMessagesStore[a.id];
                const liveB = chatMessagesStore[b.id];
                const lastMsgA = liveA && liveA.length > 0 ? liveA[liveA.length - 1] : a.messages?.[0];
                const lastMsgB = liveB && liveB.length > 0 ? liveB[liveB.length - 1] : b.messages?.[0];
                const timeA = lastMsgA ? new Date(lastMsgA.created_at).getTime() : new Date(a.created_at).getTime();
                const timeB = lastMsgB ? new Date(lastMsgB.created_at).getTime() : new Date(b.created_at).getTime();
                return timeB - timeA;
              })
              .map((session) => {
                const liveMsgs = chatMessagesStore[session.id];
                const lastMsg = liveMsgs && liveMsgs.length > 0 ? liveMsgs[liveMsgs.length - 1] : session.messages?.[0];
              const isActive = activeSession?.id === session.id;
              
              return (
                <button
                  key={session.id}
                  onClick={() => selectSession(session)}
                  className={`w-full flex items-start gap-3 p-4 border-b border-white/5 text-left transition-colors hover:bg-white/5 ${
                    isActive ? "bg-violet-600/15 border-l-2 border-l-violet-500" : "border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
                    <User size={18} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white truncate">
                        {session.user?.full_name || "Khách hàng ẩn danh"}
                      </p>
                    </div>
                    <p className={`text-sm truncate mt-1 ${isActive ? "text-violet-200" : "text-gray-400"}`}>
                      {lastMsg ? lastMsg.message_text : "Bắt đầu trò chuyện"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#12101A]">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#181622] shadow-sm z-10">
              <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
                <User size={18} className="text-violet-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  {activeSession.user?.full_name || "Khách hàng ẩn danh"}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <p className="text-xs text-gray-400">Đang hoạt động</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Chưa có tin nhắn
                </div>
              ) : (
                currentMessages.map((msg: any) => {
                  const isShop = msg.sender_type === "SHOP";
                  const isBot = msg.sender_type === "BOT";
                  const isMine = isShop || isBot;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
                          isShop
                            ? "bg-violet-600 text-white rounded-br-sm"
                            : isBot
                            ? "bg-indigo-600 text-white rounded-br-sm border border-indigo-400"
                            : "bg-[#242133] text-gray-100 rounded-bl-sm"
                        }`}
                      >
                        {isBot && <div className="text-[10px] text-indigo-200 mb-1 font-semibold flex items-center gap-1">🤖 AI Trả lời tự động</div>}
                        {msg.message_text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-[#181622] border-t border-white/10 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập tin nhắn gửi tới khách hàng..."
                    className="w-full bg-white/5 border border-white/10 text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all placeholder:text-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-violet-500 transition-colors shrink-0 shadow-lg shadow-violet-900/40"
                >
                  <Send size={18} className="-ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-16 h-16 rounded-full bg-[#181622] shadow-inner flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-sm">Chọn một cuộc hội thoại để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
}
