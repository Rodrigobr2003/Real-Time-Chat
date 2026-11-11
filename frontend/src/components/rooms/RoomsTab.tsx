import { CloudOff, MessagesSquare, Plus, SearchX } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useChat } from "../../hooks/useChat";
import { useChatList } from "../../hooks/useChatList";
import type { IPublicChat, IPunishmentInfo } from "../../model/chatModel";
import { getApiErrors, getPunishment } from "../../utils/apiErrors";
import { Button } from "../ui/Button";
import { FieldError } from "../ui/Input";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinPrivateRoomModal } from "./JoinPrivateRoomModal";
import { PunishmentModal } from "./PunishmentModal";
import { RoomFilters } from "./RoomFilters";
import { RoomItem } from "./RoomItem";

const Wrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    font-size: 16px;
  }
`;

const CountBadge = styled.span`
  min-width: 28px;
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(108, 92, 231, 0.15);
  color: ${({ theme }) => theme.colors.primary};
  font-size: 13px;
  font-weight: 700;
  text-align: center;
`;

const RoomList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-inline: -12px;
  padding-inline: 4px;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  text-align: center;
`;

const LoadMoreButton = styled(Button)`
  align-self: center;
  flex-shrink: 0;
  height: 34px;
  margin-top: 4px;
  font-size: 13px;
`;

export function RoomsTab() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    chats,
    totalChats,
    isListPending,
    isListError,
    refetchChats,
    fetchNextChatsPage,
    hasNextChatsPage,
    isFetchingNextChatsPage,
  } = useChatList();
  const { connectChatMutation, isConnectPending } = useChat();
  const locationState = useLocation().state as {
    joinError?: string;
    punishment?: IPunishmentInfo;
    roomName?: string;
  } | null;
  const [joinError, setJoinError] = useState(
    locationState?.punishment ? "" : (locationState?.joinError ?? ""),
  );
  const [punished, setPunished] = useState<{
    punishment: IPunishmentInfo;
    roomName?: string;
  } | null>(
    locationState?.punishment
      ? {
          punishment: locationState.punishment,
          roomName: locationState.roomName,
        }
      : null,
  );
  const [privateRoom, setPrivateRoom] = useState<IPublicChat | null>(null);

  function openRoom(room: IPublicChat) {
    setJoinError("");

    if (room.privacy === "private") return setPrivateRoom(room);
    if (isConnectPending) return;

    connectChatMutation(
      { chatId: room.chatId },
      {
        onSuccess: (connection) =>
          navigate(`/chat/${room.chatId}`, { state: { room, ...connection } }),
        onError: (error) => {
          const punishment = getPunishment(error);

          if (punishment)
            return setPunished({ punishment, roomName: room.name });

          setJoinError(getApiErrors(error).message);
        },
      },
    );
  }

  function renderRooms() {
    if (isListPending) {
      return <EmptyState aria-busy="true">Carregando salas...</EmptyState>;
    }

    if (isListError) {
      return (
        <EmptyState>
          <CloudOff size={32} />
          Não foi possível carregar as salas
          <Button $variant="ghost" onClick={refetchChats}>
            Tentar novamente
          </Button>
        </EmptyState>
      );
    }

    if (chats.length === 0) {
      return hasActiveFilters ? (
        <EmptyState>
          <SearchX size={32} />
          Nenhuma sala encontrada com esses filtros
          <Button $variant="ghost" onClick={resetFilters}>
            Limpar filtros
          </Button>
        </EmptyState>
      ) : (
        <EmptyState>
          <MessagesSquare size={32} />
          Nenhuma sala criada ainda
        </EmptyState>
      );
    }

    return (
      <>
        {chats.map((room) => (
          <RoomItem
            key={room.chatId}
            room={room}
            onClick={() => openRoom(room)}
          />
        ))}
        {hasNextChatsPage && (
          <LoadMoreButton
            $variant="ghost"
            onClick={fetchNextChatsPage}
            disabled={isFetchingNextChatsPage}
          >
            {isFetchingNextChatsPage ? "Carregando..." : "Carregar mais salas"}
          </LoadMoreButton>
        )}
      </>
    );
  }

  return (
    <Wrapper>
      <SectionHeader>
        <h2>Salas de conversa</h2>
        <CountBadge>{totalChats}</CountBadge>
      </SectionHeader>

      <RoomFilters filters={filters} onChange={setFilters} />

      {joinError && <FieldError role="alert">{joinError}</FieldError>}

      <RoomList>{renderRooms()}</RoomList>

      <Button $fullWidth onClick={() => setIsModalOpen(true)}>
        <Plus size={18} />
        Nova sala
      </Button>

      <CreateRoomModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <JoinPrivateRoomModal
        room={privateRoom}
        onClose={() => setPrivateRoom(null)}
        onPunished={(punishment, roomName) =>
          setPunished({ punishment, roomName })
        }
      />

      <PunishmentModal
        punishment={punished?.punishment ?? null}
        roomName={punished?.roomName}
        onClose={() => setPunished(null)}
      />
    </Wrapper>
  );
}
