import type { EmojiClickData } from "emoji-picker-react";
import { Smile } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import styled from "styled-components";

type EmojiPickerButtonProps = {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
  label?: string;
  iconSize?: number;
  closeOnSelect?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

type Placement = { vertical: "up" | "down"; align: "start" | "end" };

const PICKER_HEIGHT = 380;

const EmojiPicker = lazy(() => import("emoji-picker-react"));

const loadPortugueseEmojis = () => import("emoji-picker-react/data/emojis-pt");

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

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Popover = styled.div<{ $placement: Placement }>`
  position: absolute;
  ${({ $placement }) =>
    $placement.vertical === "up"
      ? "bottom: calc(100% + 14px);"
      : "top: calc(100% + 8px);"}
  ${({ $placement }) =>
    $placement.align === "start" ? "left: -6px;" : "right: -6px;"}
  z-index: 20;
  width: min(352px, calc(100vw - 20px));
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow};

  .EmojiPickerReact {
    --epr-dark-bg-color: ${({ theme }) => theme.colors.surface};
    --epr-dark-category-label-bg-color: ${({ theme }) => theme.colors.surface};
    --epr-dark-picker-border-color: ${({ theme }) => theme.colors.border};
    --epr-dark-search-input-bg-color: ${({ theme }) => theme.colors.surfaceAlt};
    --epr-dark-search-input-bg-color-active: ${({ theme }) =>
      theme.colors.surfaceAlt};
    --epr-dark-hover-bg-color: ${({ theme }) => theme.colors.surfaceAlt};
    --epr-dark-focus-bg-color: ${({ theme }) => theme.colors.surfaceAlt};
    --epr-dark-highlight-color: ${({ theme }) => theme.colors.primary};
    --epr-dark-category-icon-active-color: ${({ theme }) =>
      theme.colors.primary};
    --epr-dark-text-color: ${({ theme }) => theme.colors.text};
    --epr-search-border-color-active: ${({ theme }) => theme.colors.primary};
    font-family: inherit;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    position: fixed;
    top: auto;
    left: 10px;
    right: 10px;
    bottom: calc(72px + env(safe-area-inset-bottom));
    width: auto;
  }
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${PICKER_HEIGHT}px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
`;

export function EmojiPickerButton({
  onSelect,
  disabled = false,
  label = "Inserir emoji",
  iconSize = 20,
  closeOnSelect = false,
  onOpenChange,
  className,
}: EmojiPickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>({
    vertical: "up",
    align: "start",
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const open = isOpen && !disabled;

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  function setOpen(next: boolean) {
    setIsOpen(next);
    onOpenChangeRef.current?.(next);
  }

  function toggle() {
    if (open) return setOpen(false);

    const rect = wrapperRef.current?.getBoundingClientRect();

    if (rect) {
      setPlacement({
        vertical: rect.top < PICKER_HEIGHT + 24 ? "down" : "up",
        align: rect.left > window.innerWidth / 2 ? "end" : "start",
      });
    }

    setOpen(true);
  }

  function handleSelect(emoji: string) {
    onSelect(emoji);

    if (closeOnSelect) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const close = () => {
      setIsOpen(false);
      onOpenChangeRef.current?.(false);
    };
    const closeOnOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) close();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <Wrapper ref={wrapperRef} className={className}>
      <Trigger
        type="button"
        $open={open}
        disabled={disabled}
        onClick={toggle}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Smile size={iconSize} />
      </Trigger>

      {open && (
        <Popover
          role="dialog"
          aria-label="Escolher emoji"
          $placement={placement}
        >
          <Suspense fallback={<Loading>Carregando emojis...</Loading>}>
            <EmojiPicker
              theme="dark"
              width="100%"
              height={PICKER_HEIGHT}
              emojiData={loadPortugueseEmojis}
              lazyLoadEmojis
              autoFocusSearch={false}
              previewConfig={{ showPreview: false }}
              labels={{
                searchPlaceholder: "Pesquisar emoji",
                searchLabel: "Pesquisar emoji",
                searchClear: "Limpar",
                searchResultsNone: "Nenhum emoji encontrado",
                categoryNavigation: "Categorias",
                loading: "Carregando emojis...",
                loadingError: "Não foi possível carregar os emojis",
                retryLoading: "Tentar novamente",
              }}
              onEmojiClick={({ emoji }: EmojiClickData) => handleSelect(emoji)}
            />
          </Suspense>
        </Popover>
      )}
    </Wrapper>
  );
}
