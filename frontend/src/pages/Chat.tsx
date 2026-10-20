import { useEffect, useRef, useState } from "react";
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
import { MessageBubble } from "../components/chat/MessageBubble";
import { MessageInput } from "../components/chat/MessageInput";
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
  type IUpdateChatDTO,
} from "../model/chatModel";
import type { IMessage } from "../model/messageModel";
import { getApiErrors } from "../utils/apiErrors";

type ChatLocationState =
  | ({ room?: IPublicChat } & Partial<IChatConnection>)
  | null;

const Page = styled.main`
  height: 100%;
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
`;

const Messages = styled.section`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 16px;
`;

const DayTag = styled.span`
  align-self: center;
  margin-bottom: 8px;
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
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    data: messages = [],
    send,
    edit,
    remove,
  } = useMessages(roomId, isConnected);
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

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
          state: { joinError: getApiErrors(error).message },
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
  }, [roomId, queryClient, navigate]);

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

  function handleSend() {
    const content = text.trim();
    if (!content) return;

    send.mutate(content, { onSuccess: () => setText("") });
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

        <Messages>
          <DayTag>Hoje</DayTag>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              mine={message.owner.id === currentUserId}
              onEdit={openEditMessage}
              onDelete={({ id }) => remove.mutate(id)}
            />
          ))}
          <div ref={messagesEndRef} />
        </Messages>

        <MessageInput
          value={text}
          onChange={setText}
          onSend={handleSend}
          disabled={!isConnected || send.isPending}
        />
      </Container>

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
