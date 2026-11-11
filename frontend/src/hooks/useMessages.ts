import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import {
  deleteMessage,
  editMessage,
  listMessages,
  reactToMessage,
  sendAttachmentMessage,
  sendMessage,
} from "../api/messageHelpers";
import { CHATS_QUERY_KEY } from "../context/chatListContextInstance";
import {
  MESSAGES_PAGE_SIZE,
  type IChatMessage,
  type IMessage,
  type IMessageAttachment,
} from "../model/messageModel";
import { getApiErrors } from "../utils/apiErrors";
import { getAttachmentSection, getExtension } from "../utils/attachments";
import type { ServerEvent } from "../model/realtimeModel";
import { useAuth } from "./useAuth";
import { useChatRealtime } from "./useChatRealtime";

const SEND_MAX_RETRIES = 5;
const SEND_RETRY_BASE_DELAY_MS = 1000;
const SEND_RETRY_MAX_DELAY_MS = 30_000;

type SendVariables = { content: string; clientMessageId: string };

type AttachmentVariables = SendVariables & { files: File[] };

const UPLOAD_MAX_RETRIES = 2;

const toLocalAttachment = (file: File, index: number): IMessageAttachment => ({
  id: `local-${index}`,
  kind: getAttachmentSection(file.name).kind,
  name: file.name,
  extension: getExtension(file.name),
  size: file.size,
  mimeType: file.type,
  url: null,
});

const isRetryableError = (error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined;

  return (
    status === undefined || status >= 500 || status === 408 || status === 429
  );
};

export const useMessages = (
  chatId: string,
  enabled: boolean,
  // Eventos da sala que não são mensagens (ex.: "room:updated")
  onRoomEvent?: (event: ServerEvent) => void,
) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = [...CHATS_QUERY_KEY, chatId, "messages"];
  const [outbox, setOutbox] = useState<IChatMessage[]>([]);
  const pendingFiles = useRef(new Map<string, File[]>());

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
      pendingFiles.current.delete(message.clientMessageId);
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
    error?: string,
  ) =>
    setOutbox((current) =>
      current.map((message) =>
        message.clientMessageId === clientMessageId
          ? { ...message, status, error }
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
        event.type === "message:deleted" ||
        event.type === "message:reacted"
      ) {
        confirm(event.message);
      } else {
        onRoomEvent?.(event);
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

  const { mutate: dispatchAttachments } = useMutation({
    mutationFn: ({ content, clientMessageId, files }: AttachmentVariables) =>
      sendAttachmentMessage(chatId, files, content, clientMessageId),
    scope: { id: `send-message:${chatId}` },
    retry: (failureCount, error) =>
      failureCount < UPLOAD_MAX_RETRIES && isRetryableError(error),
    retryDelay: (attempt) =>
      Math.min(SEND_RETRY_BASE_DELAY_MS * 2 ** attempt, SEND_RETRY_MAX_DELAY_MS),
    onSuccess: confirm,
    onError: (error, { clientMessageId }) =>
      setOutboxStatus(clientMessageId, "failed", getApiErrors(error).message),
  });

  const dispatch = (variables: SendVariables) => {
    const files = pendingFiles.current.get(variables.clientMessageId);

    if (files?.length) dispatchAttachments({ ...variables, files });
    else dispatchSend(variables);
  };

  const send = (content: string, files: File[] = []) => {
    if (!user) return;

    const clientMessageId = crypto.randomUUID();

    if (files.length) pendingFiles.current.set(clientMessageId, files);

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
        kind: "user",
        system: null,
        type: files.length ? "attachment" : "text",
        content,
        clientMessageId,
        reactions: [],
        attachments: files.map(toLocalAttachment),
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        status: "pending",
      },
    ]);

    dispatch({ content, clientMessageId });
  };

  const retrySend = ({ content, clientMessageId }: IChatMessage) => {
    if (!clientMessageId) return;

    setOutboxStatus(clientMessageId, "pending");
    dispatch({ content, clientMessageId });
  };

  const discard = ({ clientMessageId }: IChatMessage) => {
    if (clientMessageId) pendingFiles.current.delete(clientMessageId);

    setOutbox((current) =>
      current.filter((message) => message.clientMessageId !== clientMessageId),
    );
  };

  const edit = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      editMessage(chatId, id, content),
    onSuccess: upsert,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMessage(chatId, id),
    onSuccess: upsert,
  });

  const react = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      reactToMessage(chatId, id, emoji),
    onSuccess: upsert,
  });

  return { ...query, messages, send, retrySend, discard, edit, remove, react };
};
