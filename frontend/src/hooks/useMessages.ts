import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteMessage,
  editMessage,
  listMessages,
  sendMessage,
} from "../api/messageHelpers";
import { CHATS_QUERY_KEY } from "../context/chatListContextInstance";
import type { IMessage } from "../model/messageModel";

const MESSAGES_POLLING_MS = 3000;

export const useMessages = (chatId: string, enabled: boolean) => {
  const queryClient = useQueryClient();
  const queryKey = [...CHATS_QUERY_KEY, chatId, "messages"];

  const query = useQuery({
    queryKey,
    queryFn: () => listMessages(chatId),
    enabled: !!chatId && enabled,
    refetchInterval: MESSAGES_POLLING_MS,
  });

  const upsert = (message: IMessage) =>
    queryClient.setQueryData<IMessage[]>(queryKey, (current = []) =>
      current.some(({ id }) => id === message.id)
        ? current.map((item) => (item.id === message.id ? message : item))
        : [...current, message],
    );

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(chatId, content),
    onSuccess: upsert,
  });

  const edit = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      editMessage(chatId, id, content),
    onSuccess: upsert,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMessage(chatId, id),
    onSuccess: upsert,
  });

  return { ...query, send, edit, remove };
};
