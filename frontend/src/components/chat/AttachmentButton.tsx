import { Paperclip } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import styled from "styled-components";
import {
  ATTACHMENT_SECTIONS,
  formatFileSize,
  getExtension,
  type AttachmentKind,
  type AttachmentSection,
} from "../../utils/attachments";

type AttachmentButtonProps = {
  onSelect?: (files: File[], kind: AttachmentKind) => void;
  onReject?: (message: string) => void;
  disabled?: boolean;
  className?: string;
};

const Wrapper = styled.div`
  position: relative;
  display: flex;
`;

const Trigger = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ $open, theme }) =>
    $open ? theme.colors.primary : theme.colors.textMuted};
  transition:
    color 0.2s,
    background 0.2s;

  svg {
    transition: transform 0.2s;
    transform: rotate(${({ $open }) => ($open ? "45deg" : "0")});
  }

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Menu = styled.div`
  position: absolute;
  bottom: calc(100% + 14px);
  left: -6px;
  z-index: 20;
  width: 240px;
  padding: 6px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};
`;

const Option = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  text-align: left;
  color: ${({ theme }) => theme.colors.text};
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const OptionIcon = styled.span<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $color }) => $color};
  color: #fff;
`;

const OptionText = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: 14px;
    font-weight: 600;
  }

  small {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
  }
`;

const toAccept = (extensions: string[]) =>
  extensions.map((extension) => `.${extension}`).join(",");

export function AttachmentButton({
  onSelect,
  onReject,
  disabled = false,
  className,
}: AttachmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState(ATTACHMENT_SECTIONS[0]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const open = isOpen && !disabled;

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function pick(next: AttachmentSection) {
    setSection(next);
    setIsOpen(false);

    const input = fileRef.current;
    if (!input) return;

    input.accept = toAccept(next.extensions);
    input.click();
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const allowed = new Set(section.extensions);
    const selected = [...(event.target.files ?? [])].filter((file) =>
      allowed.has(getExtension(file.name)),
    );
    const files = selected.filter((file) => file.size <= section.maxSize);
    const rejected = selected.length - files.length;

    event.target.value = "";

    if (files.length) onSelect?.(files, section.kind);

    if (rejected) {
      onReject?.(
        rejected === 1
          ? `1 arquivo passou do limite de ${formatFileSize(section.maxSize)} para ${section.label.toLowerCase()}`
          : `${rejected} arquivos passaram do limite de ${formatFileSize(section.maxSize)} para ${section.label.toLowerCase()}`,
      );
    }

  }

  return (
    <Wrapper ref={wrapperRef} className={className}>
      <Trigger
        type="button"
        $open={open}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Anexar arquivo"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Paperclip size={20} />
      </Trigger>

      {open && (
        <Menu role="menu" aria-label="Opções de anexo">
          {ATTACHMENT_SECTIONS.map((item) => (
            <Option
              key={item.kind}
              type="button"
              role="menuitem"
              onClick={() => pick(item)}
            >
              <OptionIcon $color={item.color}>
                <item.icon size={18} />
              </OptionIcon>
              <OptionText>
                <strong>{item.label}</strong>
                <small>{item.extensions.join(", ")}</small>
                <small>Até {formatFileSize(item.maxSize)}</small>
              </OptionText>
            </Option>
          ))}
        </Menu>
      )}

      <input ref={fileRef} type="file" multiple hidden onChange={handleFiles} />
    </Wrapper>
  );
}
