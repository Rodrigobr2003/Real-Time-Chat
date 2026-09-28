import { X } from "lucide-react";
import type { ReactNode } from "react";
import styled from "styled-components";
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
`;

const Dialog = styled.div`
  width: 100%;
  max-width: 420px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    font-size: 18px;
  }
`;

export function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Dialog role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
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
