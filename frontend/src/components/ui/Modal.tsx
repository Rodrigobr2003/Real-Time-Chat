import { X } from "lucide-react";
import type { ReactNode } from "react";
import styled, { keyframes } from "styled-components";
import { IconButton } from "./Button";

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: flex-end;
    padding: 0;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(24px);
    opacity: 0;
  }
`;

const Dialog = styled.div`
  width: 100%;
  max-width: 420px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow};

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    max-width: 460px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: none;
    max-height: 92dvh;
    gap: 16px;
    padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
    border-bottom: none;
    border-radius: ${({ theme }) => theme.radius.lg}
      ${({ theme }) => theme.radius.lg} 0 0;
    animation: ${slideUp} 0.2s ease-out;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    min-width: 0;
    font-size: 18px;
    overflow-wrap: anywhere;
  }

  > button {
    flex-shrink: 0;
  }
`;

export function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Dialog
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <Header>
          <h2>{title}</h2>
          <IconButton onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </IconButton>
        </Header>
        {children}
      </Dialog>
    </Overlay>
  );
}
