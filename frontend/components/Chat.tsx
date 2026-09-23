"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Chat({ raceId }: { raceId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    socket.emit("join:race", raceId);
    socket.on("chat:message", (msg) =>
      setMessages((prev) => [...prev.slice(-99), msg])
    );
    return () => socket.disconnect();
  }, [raceId]);

  const send = () => {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("chat:message", {
      raceId,
      userName: "Гость",
      message: text,
    });
    setText("");
  };

  return (
    <div className="flex flex-col h-72">
      <div className="flex-1 overflow-y-auto space-y-2 p-2 border border-border rounded-lg">
        {messages.map((m) => (
          <div key={m.id}>
            <span className="font-semibold text-accent2">{m.user_name}: </span>
            <span>{m.message}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm"
          placeholder="Сообщение..."
        />
        <button onClick={send} className="px-4 py-2 bg-accent text-black rounded-lg font-semibold">
          →
        </button>
      </div>
    </div>
  );
}
