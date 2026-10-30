import type { ServerEvent } from "../model/realtimeModel";
import { useRealtimeSocket } from "./useRealtimeSocket";

export const useChatRealtime = (
  chatId: string,
  enabled: boolean,
  onEvent: (event: ServerEvent) => void,
  onReconnect: () => void,
) =>
  useRealtimeSocket(
    { type: "room:join", chatId },
    enabled,
    onEvent,
    onReconnect,
  );
