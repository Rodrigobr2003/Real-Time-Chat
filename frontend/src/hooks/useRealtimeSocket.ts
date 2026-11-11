import { useEffect, useRef } from "react";
import { refreshSessionOnce } from "../api/interceptors";
import type { ClientEvent, ServerEvent } from "../model/realtimeModel";

const WS_URL = import.meta.env.VITE_API_URL.replace(/^http/, "ws").replace(
  /\/api\/?$/,
  "/ws",
);

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const SESSION_EXPIRED_CODE = 4001;

export const useRealtimeSocket = (
  subscribeEvent: ClientEvent,
  enabled: boolean,
  onEvent: (event: ServerEvent) => void,
  onReconnect: () => void,
) => {
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onEventRef.current = onEvent;
    onReconnectRef.current = onReconnect;
  });

  const subscribeMessage = JSON.stringify(subscribeEvent);

  useEffect(() => {
    if (!enabled) return;

    let closedByUs = false;
    let attempts = 0;
    let ws: WebSocket;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        const isReconnect = attempts > 0;
        attempts = 0;
        ws.send(subscribeMessage);

        if (isReconnect) onReconnectRef.current();
      };

      ws.onmessage = (e) => onEventRef.current(JSON.parse(e.data));

      ws.onclose = (event) => {
        if (closedByUs) return;

        if (event.code === SESSION_EXPIRED_CODE) {
          refreshSessionOnce()
            .then(() => {
              if (closedByUs) return;

              attempts++;
              connect();
            })
            .catch(() => {});
          return;
        }

        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * 2 ** attempts,
          RECONNECT_MAX_DELAY_MS,
        );
        attempts++;
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(retryTimer);
      ws.close(1000);
    };
  }, [subscribeMessage, enabled]);
};
