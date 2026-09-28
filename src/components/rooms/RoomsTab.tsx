import { MessagesSquare, Plus, SearchX } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { mockRooms, type Room } from "../../mocks/rooms";
import { Button } from "../ui/Button";
import { CreateRoomModal } from "./CreateRoomModal";
import { RoomFilters, type Filters } from "./RoomFilters";
import { RoomItem } from "./RoomItem";

const INITIAL_FILTERS: Filters = {
  search: "",
  visibility: "all",
  people: "any",
  onlyAvailable: false,
};

function matchesFilters(room: Room, filters: Filters) {
  const search = filters.search.trim().toLowerCase();
  if (search && !room.name.toLowerCase().includes(search)) return false;

  if (filters.visibility === "public" && room.isPrivate) return false;
  if (filters.visibility === "private" && !room.isPrivate) return false;

  if (filters.onlyAvailable && room.members >= room.maxMembers) return false;

  switch (filters.people) {
    case "1-2":
      return room.members <= 2;
    case "3-5":
      return room.members >= 3 && room.members <= 5;
    case "6-10":
      return room.members >= 6 && room.members <= 10;
    case "10+":
      return room.members > 10;
    default:
      return true;
  }
}

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

export function RoomsTab() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const filteredRooms = mockRooms.filter((room) => matchesFilters(room, filters));
  const hasActiveFilters = filteredRooms.length !== mockRooms.length;

  return (
    <Wrapper>
      <SectionHeader>
        <h2>Salas de conversa</h2>
        <CountBadge>
          {hasActiveFilters
            ? `${filteredRooms.length} de ${mockRooms.length}`
            : mockRooms.length}
        </CountBadge>
      </SectionHeader>

      <RoomFilters filters={filters} onChange={setFilters} />

      <RoomList>
        {mockRooms.length === 0 ? (
          <EmptyState>
            <MessagesSquare size={32} />
            Nenhuma sala criada ainda
          </EmptyState>
        ) : filteredRooms.length === 0 ? (
          <EmptyState>
            <SearchX size={32} />
            Nenhuma sala encontrada com esses filtros
            <Button $variant="ghost" onClick={() => setFilters(INITIAL_FILTERS)}>
              Limpar filtros
            </Button>
          </EmptyState>
        ) : (
          filteredRooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              onClick={() => navigate(`/chat/${room.id}`)}
            />
          ))
        )}
      </RoomList>

      <Button $fullWidth onClick={() => setIsModalOpen(true)}>
        <Plus size={18} />
        Nova sala
      </Button>

      <CreateRoomModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={() => setIsModalOpen(false)}
      />
    </Wrapper>
  );
}
