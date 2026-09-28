import styled from "styled-components";

export const Tabs = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 14px;
  font-weight: 600;
  background: ${({ $active, theme }) => ($active ? theme.colors.surface : "transparent")};
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  box-shadow: ${({ $active }) => ($active ? "0 2px 8px rgba(0, 0, 0, 0.25)" : "none")};
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;
