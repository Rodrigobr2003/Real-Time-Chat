import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  connectChat,
  deleteChat,
  leaveChat,
  updateChat,
} from "../api/chatHelpers";
import { ChatHeader } from "../components/chat/ChatHeader";
import { EditMessageModal } from "../components/chat/EditMessageModal";
import { PunishmentModal } from "../components/rooms/PunishmentModal";
import { MessageBubble } from "../components/chat/MessageBubble";
import { MessageInput } from "../components/chat/MessageInput";
import { SystemMessage } from "../components/chat/SystemMessage";
import {
  RoomSettingsModal,
  type RoomSettings,
  type RoomSettingsChanges,
} from "../components/chat/RoomSettingsModal";
import { CHATS_QUERY_KEY } from "../context/chatListContextInstance";
import { useAuth } from "../hooks/useAuth";
import { useConnectedUsers } from "../hooks/useConnectedUsers";
import { useMessages } from "../hooks/useMessages";
import {
  CHAT_BG_COLORS,
  type IChatConnection,
  type IPublicChat,
  type IPunishmentInfo,
  type IUpdateChatDTO,
} from "../model/chatModel";
import type { IMessage } from "../model/messageModel";
import type { ServerEvent } from "../model/realtimeModel";
import { getApiErrors, getPunishment } from "../utils/apiErrors";
import { formatDayLabel, getDayKey } from "../utils/messageDate";

type ChatLocationState =
  | ({ room?: IPublicChat } & Partial<IChatConnection>)
  | null;

const Page = styled.main`
  height: 100%;
  height: 100dvh;
  display: flex;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`;

const Container = styled.div`
  width: 100%;
  max-width: 900px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-inline: 1px solid ${({ theme }) => theme.colors.border};

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    max-width: 1080px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    max-width: none;
    border-inline: none;
  }
`;

const Messages = styled.section`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 16px;
  overscroll-behavior: contain;

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 24px 32px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 6px;
    padding: 12px 10px;
  }
`;

const ScrollAnchor = styled.div``;

const DayTag = styled.span`
  align-self: center;
  margin-block: 8px;
  padding: 4px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export default function Chat() {
  const navigate = useNavigate();
  const { roomId = "" } = useParams();
  const [text, setText] = useState("");
  const locationState = useLocation().state as ChatLocationState;
  const room = locationState?.room;
  const roomName = room?.name;
  const [connection, setConnection] = useState<IChatConnection>({
    isAdmin: locationState?.isAdmin ?? false,
    isOwner: locationState?.isOwner ?? false,
  });
  const { isAdmin, isOwner } = connection;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<RoomSettings>(() => ({
    name: room?.name ?? "Sala",
    privacy: room?.privacy ?? "public",
    userLimit: room?.userLimit ?? 0,
    chatBgColor: room?.chatBgColor ?? CHAT_BG_COLORS[0],
    chatPhotoURL: room?.chatPhotoURL ?? null,
  }));
  const { data: connectedUsers = [], isPending: isLoadingUsers } =
    useConnectedUsers(roomId);
  const queryClient = useQueryClient();
  const pendingLeave = useRef<{ roomId: string; timer: number } | null>(null);
  const currentUserId = useAuth().user?.id;
  const [isConnected, setIsConnected] = useState(false);
  const [punishment, setPunishment] = useState<IPunishmentInfo | null>(null);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const messagesRef = useRef<HTMLElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeLoad = useRef<number | null>(null);
  const {
    messages,
    send,
    retrySend,
    discard,
    edit,
    remove,
    react,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(roomId, isConnected, handleRoomEvent);

  function handleRoomEvent(event: ServerEvent) {
    switch (event.type) {
      case "room:updated": {
        const { chat } = event;

        setSettings({
          name: chat.name,
          privacy: chat.privacy,
          userLimit: chat.userLimit,
          chatBgColor: chat.chatBgColor,
          chatPhotoURL: chat.chatPhotoURL,
        });
        queryClient.invalidateQueries({
          queryKey: [...CHATS_QUERY_KEY, "list"],
        });
        return;
      }

      case "room:promote-admin":
      case "room:demote-admin": {
        const isPromotion = event.type === "room:promote-admin";
        const targetId = isPromotion
          ? event.userIdToPromote
          : event.userIdToDemote;

        queryClient.invalidateQueries({
          queryKey: [...CHATS_QUERY_KEY, roomId, "connected-users"],
        });

        if (targetId === currentUserId) {
          setConnection((current) => ({ ...current, isAdmin: isPromotion }));
        }
        return;
      }

      case "room:remove":
      case "room:temporary-ban":
      case "room:permanent-ban":
      case "room:remove-ban":
        queryClient.invalidateQueries({
          queryKey: [...CHATS_QUERY_KEY, roomId, "connected-users"],
        });
        queryClient.invalidateQueries({
          queryKey: [...CHATS_QUERY_KEY, roomId, "blocked-users"],
        });

        if (
          event.type !== "room:remove-ban" &&
          event.target.id === currentUserId
        ) {
          setIsConnected(false);

          if (event.type === "room:temporary-ban") {
            setPunishment({ type: "temporary", expiresAt: event.expiresAt });
          }

          if (event.type === "room:permanent-ban") {
            setPunishment({ type: "blocked", expiresAt: null });
          }
        }
        return;

      case "room:deleted":
        queryClient.invalidateQueries({
          queryKey: [...CHATS_QUERY_KEY, "list"],
        });
        setIsConnected(false);
        return;
    }
  }

  const firstMessageId = messages[0]?.id;
  const lastMessageId = messages.at(-1)?.id;
  const previousLastMessageId = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container || scrollHeightBeforeLoad.current === null) return;

    container.scrollTop +=
      container.scrollHeight - scrollHeightBeforeLoad.current;
    scrollHeightBeforeLoad.current = null;
  }, [firstMessageId]);

  useLayoutEffect(() => {
    if (!lastMessageId) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: previousLastMessageId.current ? "smooth" : "auto",
    });
    previousLastMessageId.current = lastMessageId;
  }, [lastMessageId]);

  useEffect(() => {
    const container = messagesRef.current;
    const top = messagesTopRef.current;
    if (!container || !top || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        scrollHeightBeforeLoad.current = container.scrollHeight;
        fetchNextPage();
      },
      { root: container },
    );

    observer.observe(top);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (pendingLeave.current?.roomId === roomId) {
      clearTimeout(pendingLeave.current.timer);
    }
    pendingLeave.current = null;

    let isActive = true;
    connectChat({ chatId: roomId })
      .then((result) => {
        if (!isActive) return;
        setConnection(result);
        setIsConnected(true);
        queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
      })
      .catch((error) => {
        if (!isActive) return;
        navigate("/home", {
          replace: true,
          state: {
            joinError: getApiErrors(error).message,
            punishment: getPunishment(error),
            roomName,
          },
        });
      });

    let hasLeft = false;
    const leave = () => {
      if (hasLeft) return;
      hasLeft = true;
      leaveChat(roomId)
        .catch(() => {})
        .finally(() =>
          queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY }),
        );
    };

    window.addEventListener("pagehide", leave);

    return () => {
      isActive = false;
      setIsConnected(false);
      window.removeEventListener("pagehide", leave);
      pendingLeave.current = { roomId, timer: window.setTimeout(leave, 0) };
    };
  }, [roomId, roomName, queryClient, navigate]);

  const {
    mutate: saveChat,
    isPending: isSavingChat,
    error: saveChatError,
    reset: resetSaveChat,
  } = useMutation({
    mutationFn: (dto: IUpdateChatDTO) => updateChat(roomId, dto),
    onSuccess: (chat) => {
      setSettings({
        name: chat.name,
        privacy: chat.privacy,
        userLimit: chat.userLimit,
        chatBgColor: chat.chatBgColor,
        chatPhotoURL: chat.chatPhotoURL,
      });
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
  });

  const {
    mutate: removeChat,
    isPending: isDeletingChat,
    error: deleteChatError,
    reset: resetDeleteChat,
  } = useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
      navigate("/home");
    },
  });

  function handleSend(files: File[], { voice }: { voice: boolean }) {
    if (voice) {
      send("", files);
      return;
    }

    const content = text.trim();
    if (!content && files.length === 0) return;

    send(content, files);
    setText("");
  }

  function openEditMessage(message: IMessage) {
    edit.reset();
    setEditingMessage(message);
  }

  function handleEditMessage(content: string) {
    if (!editingMessage) return;

    edit.mutate(
      { id: editingMessage.id, content },
      { onSuccess: () => setEditingMessage(null) },
    );
  }

  function openSettings() {
    resetSaveChat();
    resetDeleteChat();
    setIsSettingsOpen(true);
  }

  function handleSaveSettings(changes: RoomSettingsChanges) {
    const dto: IUpdateChatDTO = {
      ...(changes.name !== settings.name && { name: changes.name }),
      ...(changes.userLimit !== settings.userLimit && {
        userLimit: changes.userLimit,
      }),
      ...(changes.privacy !== settings.privacy && { privacy: changes.privacy }),
      ...(changes.chatBgColor !== settings.chatBgColor && {
        chatBgColor: changes.chatBgColor,
      }),
      ...(changes.chatPhoto && { chatPhoto: changes.chatPhoto }),
      ...(changes.password && { password: changes.password }),
    };

    const finish = () => setIsSettingsOpen(false);

    if (Object.keys(dto).length === 0) return finish();

    saveChat(dto, { onSuccess: finish });
  }

  return (
    <Page>
      <Container>
        <ChatHeader
          roomName={settings.name}
          roomId={roomId}
          isPrivate={settings.privacy === "private"}
          members={
            isLoadingUsers ? (room?.usersCount ?? 0) : connectedUsers.length
          }
          maxMembers={settings.userLimit}
          photoURL={settings.chatPhotoURL}
          color={settings.chatBgColor}
          connectedUsers={connectedUsers}
          isLoadingUsers={isLoadingUsers}
          onBack={() => navigate("/home")}
          onOpenSettings={openSettings}
        />

        <Messages ref={messagesRef}>
          <ScrollAnchor ref={messagesTopRef} />
          {isFetchingNextPage && <DayTag>Carregando...</DayTag>}
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const isNewDay =
              !previous ||
              getDayKey(previous.createdAt) !== getDayKey(message.createdAt);

            return (
              <Fragment key={message.clientMessageId ?? message.id}>
                {isNewDay && (
                  <DayTag>{formatDayLabel(message.createdAt)}</DayTag>
                )}
                {message.kind === "system" ? (
                  <SystemMessage message={message} />
                ) : (
                  <MessageBubble
                    message={message}
                    mine={message.owner.id === currentUserId}
                    onEdit={openEditMessage}
                    onDelete={({ id }) => remove.mutate(id)}
                    onRetry={retrySend}
                    onDiscard={discard}
                    onReact={({ id }, emoji) => react.mutate({ id, emoji })}
                  />
                )}
              </Fragment>
            );
          })}
          <ScrollAnchor ref={messagesEndRef} />
        </Messages>

        <MessageInput
          value={text}
          onChange={setText}
          onSend={handleSend}
          disabled={!isConnected}
        />
      </Container>

      <PunishmentModal
        punishment={punishment}
        roomName={settings.name}
        onClose={() => navigate("/home", { replace: true })}
      />

      {editingMessage && (
        <EditMessageModal
          message={editingMessage}
          isSaving={edit.isPending}
          error={edit.error ? getApiErrors(edit.error).message : undefined}
          onClose={() => setEditingMessage(null)}
          onSave={handleEditMessage}
        />
      )}

      {isSettingsOpen && (
        <RoomSettingsModal
          chatId={roomId}
          canEdit={isAdmin}
          settings={settings}
          connectedUsers={connectedUsers}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          isSaving={isSavingChat}
          saveError={saveChatError && getApiErrors(saveChatError)}
          onDelete={isOwner ? () => removeChat(roomId) : undefined}
          isDeleting={isDeletingChat}
          deleteError={deleteChatError && getApiErrors(deleteChatError).message}
        />
      )}
    </Page>
  );
}
