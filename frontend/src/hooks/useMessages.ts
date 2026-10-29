import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  deleteMessage,
  editMessage,
  listMessages,
  sendMessage,
} from "../api/messageHelpers";
import { CHATS_QUERY_KEY } from "../context/chatListContextInstance";
import { MESSAGES_PAGE_SIZE, type IMessage } from "../model/messageModel";
import { useChatRealtime } from "./useChatRealtime";

export const useMessages = (chatId: string, enabled: boolean) => {
  const queryClient = useQueryClient();
  const queryKey = [...CHATS_QUERY_KEY, chatId, "messages"];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      listMessages(chatId, MESSAGES_PAGE_SIZE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < MESSAGES_PAGE_SIZE ? undefined : lastPage[0].createdAt,
    enabled: !!chatId && enabled,
  });

  const messages = query.data?.pages.toReversed().flat() ?? [];

  const upsert = (message: IMessage) =>
    queryClient.setQueryData<InfiniteData<IMessage[], string | undefined>>(
      queryKey,
      (current) => {
        if (!current) return current;

        const exists = current.pages.some((page) =>
          page.some(({ id }) => id === message.id),
        );

        const pages = exists
          ? current.pages.map((page) =>
              page.map((item) => (item.id === message.id ? message : item)),
            )
          : [[...current.pages[0], message], ...current.pages.slice(1)];

        return { ...current, pages };
      },
    );

  useChatRealtime(
    chatId,
    enabled,
    (event) => {
      if (
        event.type === "message:created" ||
        event.type === "message:updated" ||
        event.type === "message:deleted"
      ) {
        upsert(event.message);
      }
    },
    () => queryClient.invalidateQueries({ queryKey }),
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

  return { ...query, messages, send, edit, remove };
};
