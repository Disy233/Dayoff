"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  username: string;
  content: string;
  type: "text" | "gift" | "system";
  emoji?: string;
}

export function LiveChat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", username: "DayOff", content: "Welcome to the live stream! 🎉", type: "system" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Production: 
  // const room = useRoomContext();
  // room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true });
  // room.on("dataReceived", (payload) => { ... });

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), username: "You", content: input.trim(), type: "text" },
    ]);
    setInput("");
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex h-72 flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
      <div className="mb-3 max-h-48 space-y-2 overflow-y-auto hide-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            {msg.type === "system" ? (
              <span className="text-white/50">{msg.content}</span>
            ) : msg.type === "gift" ? (
              <span className="text-yellow-300">{msg.emoji} {msg.username} sent {msg.content}</span>
            ) : (
              <>
                <span className="font-semibold text-pink-400">{msg.username}</span>
                <span className="text-white">: {msg.content}</span>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Say something..."
          className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <button onClick={sendMessage} className="rounded-full bg-pink-500 p-2.5 text-white">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
