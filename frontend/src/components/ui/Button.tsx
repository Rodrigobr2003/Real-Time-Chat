import styled, { css } from "styled-components";

type ButtonProps = {
  $variant?: "primary" | "ghost";
  $fullWidth?: boolean;
};

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 18px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 600;
  transition:
    background 0.2s,
    opacity 0.2s;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};

  ${({ $variant = "primary", theme }) =>
    $variant === "primary"
      ? css`
          background: ${theme.colors.primary};
          color: #fff;

          &:hover:not(:disabled) {
            background: ${theme.colors.primaryHover};
          }
        `
      : css`
          background: transparent;
          color: ${theme.colors.textMuted};
          border: 1px solid ${theme.colors.border};

          &:hover:not(:disabled) {
            color: ${theme.colors.text};
            background: ${theme.colors.surfaceAlt};
          }
        `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ theme }) => theme.colors.textMuted};
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;
