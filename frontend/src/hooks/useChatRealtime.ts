import { useEffect, useRef } from "react";
import type { ServerEvent } from "../model/realtimeModel";

const WS_URL = import.meta.env.VITE_API_URL.replace(/^http/, "ws").replace(
  /\/api\/?$/,
  "/ws",
);

export const useChatRealtime = (
  chatId: string,
  enabled: boolean,
  onEvent: (event: ServerEvent) => void,
) => {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => ws.send(JSON.stringify({ type: "room:join", chatId }));
    ws.onmessage = (e) => onEventRef.current(JSON.parse(e.data));

    return () => ws.close();
  }, [chatId, enabled]);
};
