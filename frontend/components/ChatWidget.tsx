"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Store } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import api from "@/lib/axios";

export function ChatWidget({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  
  const { isAuthenticated } = useAuthStore();
  const chatMessagesStore = useNotificationStore((s) => s.chatMessages);
  const messages = sessionId ? chatMessagesStore[sessionId] || [] : [];
  const pushChatMessage = useNotificationStore((s) => s.pushChatMessage);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOpen]);

  // Khi mở popup, tự động tạo/lấy session
  useEffect(() => {
    if (isOpen && !sessionId && isAuthenticated) {
      const initChat = async () => {
        setLoading(true);
        try {
          const res = await api.post(`/chat/shop/${shopId}`);
          const session = res.data;
          setSessionId(session.id);
          // Lấy tin nhắn cũ
          const msgRes = await api.get(`/chat/sessions/${session.id}/messages`);
          if (msgRes.data && msgRes.data.length > 0) {
            msgRes.data.forEach((m: any) => pushChatMessage(session.id, m));
          }
        } catch (error) {
          console.error("Failed to init chat", error);
        } finally {
          setLoading(false);
        }
      };
      initChat();
    }
  }, [isOpen, sessionId, shopId, isAuthenticated, pushChatMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !sessionId) return;

    const messageText = text;
    setText("");

    try {
      const res = await api.post(`/chat/sessions/${sessionId}/messages`, {
        message_text: messageText,
      });
      // Backend returns { message: savedMessage }
      if (res.data.message) {
        pushChatMessage(sessionId, res.data.message);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      setText(messageText); // restore if failed
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center hover:bg-violet-700 transition-transform hover:scale-105 active:scale-95 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl bg-card border border-card-border shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
        style={{ height: "500px", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-card-border bg-violet-600 rounded-t-2xl">
          <div className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Store size={16} />
            </div>
            <div>
              <div className="text-sm font-bold leading-none">{shopName}</div>
              <div className="text-[10px] text-white/70 mt-1">Chat với chủ shop</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {loading ? (
            <div className="text-center text-xs text-slate-400 mt-4">Đang kết nối...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-xs text-slate-400 mt-4">
              Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện.
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMine = msg.sender_type === "USER";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  {!isMine && (
                    <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                      <Store size={12} className="text-violet-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      isMine
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "bg-card border border-card-border text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.message_text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-card border-t border-card-border rounded-b-2xl">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={loading || !sessionId}
              className="flex-1 bg-background border border-card-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={!text.trim() || !sessionId || loading}
              className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-violet-700 transition-colors shrink-0"
            >
              <Send size={14} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
