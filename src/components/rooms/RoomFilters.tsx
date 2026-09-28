import { Search, X } from "lucide-react";
import styled from "styled-components";

export type VisibilityFilter = "all" | "public" | "private";
export type PeopleFilter = "any" | "1-2" | "3-5" | "6-10" | "10+";

export type Filters = {
  search: string;
  visibility: VisibilityFilter;
  people: PeopleFilter;
  onlyAvailable: boolean;
};

type RoomFiltersProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "public", label: "Públicas" },
  { value: "private", label: "Privadas" },
];

const PEOPLE_OPTIONS: { value: PeopleFilter; label: string }[] = [
  { value: "any", label: "Qualquer nº de pessoas" },
  { value: "1-2", label: "1 a 2 pessoas" },
  { value: "3-5", label: "3 a 5 pessoas" },
  { value: "6-10", label: "6 a 10 pessoas" },
  { value: "10+", label: "Mais de 10 pessoas" },
];

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SearchBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  > svg {
    position: absolute;
    left: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 40px;
    padding: 0 36px;
    border-radius: ${({ theme }) => theme.radius.full};
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surfaceAlt};
    outline: none;
    font-size: 14px;

    &::placeholder {
      color: ${({ theme }) => theme.colors.textMuted};
    }

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  display: flex;
  padding: 4px;
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Segmented = styled.div`
  display: flex;
  padding: 3px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Segment = styled.button<{ $active: boolean }>`
  padding: 5px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: 13px;
  font-weight: 600;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : "transparent")};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.colors.textMuted)};
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    color: ${({ $active, theme }) => ($active ? "#fff" : theme.colors.text)};
  }
`;

const Select = styled.select`
  flex: 1;
  min-width: 150px;
  height: 34px;
  padding: 0 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Chip = styled.button<{ $active: boolean }>`
  height: 34px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: 13px;
  font-weight: 600;
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ $active }) => ($active ? "rgba(108, 92, 231, 0.15)" : "transparent")};
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textMuted)};
`;

export function RoomFilters({ filters, onChange }: RoomFiltersProps) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <Wrapper>
      <SearchBox>
        <Search size={16} />
        <input
          placeholder="Buscar sala pelo nome..."
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
        />
        {filters.search && (
          <ClearButton onClick={() => update("search", "")} aria-label="Limpar busca">
            <X size={14} />
          </ClearButton>
        )}
      </SearchBox>

      <Row>
        <Segmented role="group" aria-label="Tipo de sala">
          {VISIBILITY_OPTIONS.map((option) => (
            <Segment
              key={option.value}
              $active={filters.visibility === option.value}
              onClick={() => update("visibility", option.value)}
            >
              {option.label}
            </Segment>
          ))}
        </Segmented>

        <Chip
          $active={filters.onlyAvailable}
          onClick={() => update("onlyAvailable", !filters.onlyAvailable)}
        >
          Com vagas
        </Chip>
      </Row>

      <Row>
        <Select
          aria-label="Número de pessoas"
          value={filters.people}
          onChange={(event) => update("people", event.target.value as PeopleFilter)}
        >
          {PEOPLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Row>
    </Wrapper>
  );
}
