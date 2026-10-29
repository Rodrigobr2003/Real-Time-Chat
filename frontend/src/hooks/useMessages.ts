import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import {
  deleteMessage,
  editMessage,
  listMessages,
  sendMessage,
} from "../api/messageHelpers";
import { CHATS_QUERY_KEY } from "../context/chatListContextInstance";
import {
  MESSAGES_PAGE_SIZE,
  type IChatMessage,
  type IMessage,
} from "../model/messageModel";
import { useAuth } from "./useAuth";
import { useChatRealtime } from "./useChatRealtime";

const SEND_MAX_RETRIES = 5;
const SEND_RETRY_BASE_DELAY_MS = 1000;
const SEND_RETRY_MAX_DELAY_MS = 30_000;

type SendVariables = { content: string; clientMessageId: string };

const isRetryableError = (error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined;

  return (
    status === undefined || status >= 500 || status === 408 || status === 429
  );
};

export const useMessages = (chatId: string, enabled: boolean) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = [...CHATS_QUERY_KEY, chatId, "messages"];
  const [outbox, setOutbox] = useState<IChatMessage[]>([]);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      listMessages(chatId, MESSAGES_PAGE_SIZE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < MESSAGES_PAGE_SIZE ? undefined : lastPage[0].createdAt,
    enabled: !!chatId && enabled,
  });

  const confirmed =
    query.data?.pages
      .toReversed()
      .flat()
      .map((message): IChatMessage => ({ ...message, status: "sent" })) ?? [];

  const roomOutbox = outbox.filter((message) => message.chatId === chatId);
  const messages = [...confirmed, ...roomOutbox];

  const hasPending = outbox.some(({ status }) => status === "pending");

  useEffect(() => {
    if (!hasPending) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasPending]);

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

  const confirm = (message: IMessage) => {
    upsert(message);

    if (message.clientMessageId) {
      setOutbox((current) =>
        current.filter(
          ({ clientMessageId }) => clientMessageId !== message.clientMessageId,
        ),
      );
    }
  };

  const setOutboxStatus = (
    clientMessageId: string,
    status: IChatMessage["status"],
  ) =>
    setOutbox((current) =>
      current.map((message) =>
        message.clientMessageId === clientMessageId
          ? { ...message, status }
          : message,
      ),
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
        confirm(event.message);
      }
    },
    () => queryClient.invalidateQueries({ queryKey }),
  );

  const { mutate: dispatchSend } = useMutation({
    mutationFn: ({ content, clientMessageId }: SendVariables) =>
      sendMessage(chatId, content, clientMessageId),
    scope: { id: `send-message:${chatId}` },
    retry: (failureCount, error) =>
      failureCount < SEND_MAX_RETRIES && isRetryableError(error),
    retryDelay: (attempt) =>
      Math.min(SEND_RETRY_BASE_DELAY_MS * 2 ** attempt, SEND_RETRY_MAX_DELAY_MS),
    onSuccess: confirm,
    onError: (_error, { clientMessageId }) =>
      setOutboxStatus(clientMessageId, "failed"),
  });

  const send = (content: string) => {
    if (!user) return;

    const clientMessageId = crypto.randomUUID();

    setOutbox((current) => [
      ...current,
      {
        id: clientMessageId,
        chatId,
        owner: {
          id: user.id,
          name: user.name,
          user: user.user,
          userPhotoURL: user.userPhotoURL,
          profileBgColor: user.profileBgColor,
        },
        content,
        clientMessageId,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        status: "pending",
      },
    ]);

    dispatchSend({ content, clientMessageId });
  };

  const retrySend = ({ content, clientMessageId }: IChatMessage) => {
    if (!clientMessageId) return;

    setOutboxStatus(clientMessageId, "pending");
    dispatchSend({ content, clientMessageId });
  };

  const discard = ({ clientMessageId }: IChatMessage) =>
    setOutbox((current) =>
      current.filter((message) => message.clientMessageId !== clientMessageId),
    );

  const edit = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      editMessage(chatId, id, content),
    onSuccess: upsert,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMessage(chatId, id),
    onSuccess: upsert,
  });

  return { ...query, messages, send, retrySend, discard, edit, remove };
};
