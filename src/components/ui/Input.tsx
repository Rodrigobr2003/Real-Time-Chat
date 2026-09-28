import styled, { css } from "styled-components";

export const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const fieldStyles = css`
  width: 100%;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Input = styled.input`
  ${fieldStyles}
  height: 44px;
  padding: 0 14px;
`;

export const Textarea = styled.textarea`
  ${fieldStyles}
  min-height: 88px;
  padding: 12px 14px;
  line-height: 1.4;
  resize: vertical;
`;

export const FieldHint = styled.span`
  align-self: flex-end;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
