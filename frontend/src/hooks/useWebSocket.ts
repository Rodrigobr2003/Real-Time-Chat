import { useEffect, useRef, useState } from "react";

const WS_URL = import.meta.env.VITE_API_URL.replace(/^http/, "ws").replace(
  /\/api\/?$/,
  "/ws",
);

export const useWebSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => setMessages((prev) => [...prev, e.data]);

    return () => ws.close();
  }, []);

  const send = (data: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  };

  return { messages, connected, send };
};
