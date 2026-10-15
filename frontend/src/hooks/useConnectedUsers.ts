import { useQuery } from "@tanstack/react-query";
import { listConnectedUsers } from "../api/chatHelpers";
import { CHATS_QUERY_KEY } from "../context/chatListContextInstance";

export const useConnectedUsers = (chatId: string) =>
  useQuery({
    queryKey: [...CHATS_QUERY_KEY, chatId, "connected-users"],
    queryFn: () => listConnectedUsers(chatId),
    enabled: !!chatId,
  });
