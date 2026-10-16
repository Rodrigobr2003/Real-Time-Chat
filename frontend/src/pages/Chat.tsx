import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteChat, disconnectChat, updateChat } from "../api/chatHelpers";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageBubble } from "../components/chat/MessageBubble";
import { MessageInput } from "../components/chat/MessageInput";
import {
  RoomSettingsModal,
  type RoomSettings,
  type RoomSettingsChanges,
} from "../components/chat/RoomSettingsModal";
import { CHATS_QUERY_KEY } from "../context/chatListContextInstance";
import { useConnectedUsers } from "../hooks/useConnectedUsers";
import { mockMessages } from "../mocks/messages";
import {
  CHAT_BG_COLORS,
  type IPublicChat,
  type IUpdateChatDTO,
} from "../model/chatModel";
import { getApiErrors } from "../utils/apiErrors";

type ChatLocationState = { room?: IPublicChat } | null;

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
  const room = (useLocation().state as ChatLocationState)?.room;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<RoomSettings>(() => ({
    name: room?.name ?? "Sala",
    privacy: room?.privacy ?? "public",
    userLimit: room?.userLimit ?? 0,
    chatBgColor: room?.chatBgColor ?? CHAT_BG_COLORS[0],
    chatPhotoURL: room?.chatPhotoURL ?? null,
  }));
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([]);
  const { data: fetchedUsers = [], isPending: isLoadingUsers } =
    useConnectedUsers(roomId);
  const connectedUsers = fetchedUsers.filter(
    (user) => !hiddenUserIds.includes(user.id),
  );
  const queryClient = useQueryClient();
  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: disconnectChat,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
      navigate("/home");
    },
  });

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

  function openSettings() {
    resetSaveChat();
    resetDeleteChat();
    setIsSettingsOpen(true);
  }

  // Remover/bloquear usuários ainda é só local (sem endpoint).
  function handleSaveSettings(changes: RoomSettingsChanges) {
    const { removedUserIds, blockedUserIds } = changes;
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

    const finish = () => {
      setHiddenUserIds((current) => [
        ...current,
        ...removedUserIds,
        ...blockedUserIds,
      ]);
      setIsSettingsOpen(false);
    };

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
          onBack={() => !isDisconnecting && disconnect(roomId)}
          onOpenSettings={openSettings}
        />

        <Messages>
          <DayTag>Hoje</DayTag>
          {mockMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </Messages>

        <MessageInput
          value={text}
          onChange={setText}
          onSend={() => setText("")}
        />
      </Container>

      {isSettingsOpen && (
        <RoomSettingsModal
          settings={settings}
          connectedUsers={connectedUsers}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          isSaving={isSavingChat}
          saveError={saveChatError && getApiErrors(saveChatError)}
          onDelete={() => removeChat(roomId)}
          isDeleting={isDeletingChat}
          deleteError={deleteChatError && getApiErrors(deleteChatError).message}
        />
      )}
    </Page>
  );
}
