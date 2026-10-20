import {
  Ban,
  Camera,
  Check,
  ChevronDown,
  Hourglass,
  Lock,
  LockOpen,
  LogOut,
  Minus,
  Pencil,
  Plus,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import styled from "styled-components";
import { useAuth } from "../../hooks/useAuth";
import { useRoomModeration } from "../../hooks/useRoomModeration";
import { getApiErrors } from "../../utils/apiErrors";
import {
  CHAT_BG_COLORS,
  CHAT_MAX_USERS,
  CHAT_MIN_USERS,
  CHAT_NAME_MAX_LENGTH,
  CHAT_NAME_MIN_LENGTH,
  CHAT_PASSWORD_MAX_LENGTH,
  CHAT_PASSWORD_MIN_LENGTH,
  CHAT_PHOTO_ACCEPTED_TYPES,
  CHAT_PHOTO_MAX_SIZE,
  type ChatPrivacy,
  type IConnectedUser,
} from "../../model/chatModel";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Form } from "../ui/Card";
import { FieldError, FieldHint, Input, Label } from "../ui/Input";
import { Modal } from "../ui/Modal";

const PUNISHMENT_STEPS = ["5 minutos", "15 minutos", "1 hora"] as const;

const getNextPunishment = (kickCount: number) =>
  kickCount < PUNISHMENT_STEPS.length
    ? `Expulsão por ${PUNISHMENT_STEPS[kickCount]}`
    : "Bloqueio permanente da sala";

export type RoomSettings = {
  name: string;
  privacy: ChatPrivacy;
  userLimit: number;
  chatBgColor: string;
  chatPhotoURL: string | null;
};

export type RoomSettingsChanges = RoomSettings & {
  chatPhoto: File | null;
  password: string;
  adminUserIds: string[];
};

type RoomSettingsModalProps = {
  chatId: string;
  settings: RoomSettings;
  connectedUsers: IConnectedUser[];
  canEdit?: boolean;
  onClose: () => void;
  onSave: (changes: RoomSettingsChanges) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  deleteError?: string | null;
  isSaving?: boolean;
  saveError?: { message: string; fields?: Record<string, string> } | null;
};

const ReadOnlyPhoto = styled.div`
  align-self: center;
  display: flex;
`;

const PhotoButton = styled.button`
  position: relative;
  align-self: center;
  display: flex;
  padding: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;

  span {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover span,
  &:focus-visible span {
    opacity: 1;
  }
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  strong {
    font-size: 18px;
  }
`;

const NameEditor = styled.div`
  display: flex;
  gap: 8px;
`;

const PencilButton = styled.button`
  display: flex;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Switch = styled.button<{ $checked: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  padding: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $checked, theme }) =>
    $checked ? theme.colors.primary : theme.colors.border};
  transition: background 0.2s;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: ${({ $checked }) => ($checked ? "23px" : "3px")};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.2s;
  }
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GroupLabel = styled.span`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const UserList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  list-style: none;
`;

const UserRow = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 14px;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const RowAction = styled.button<{ $danger?: boolean }>`
  display: flex;
  padding: 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ $danger, theme }) =>
      $danger ? theme.colors.danger : theme.colors.text};
  }
`;

const MenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
`;

const ActionsMenu = styled.ul<{ $top: number; $right: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  z-index: 21;
  min-width: 220px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow};
`;

const MenuItem = styled.button<{ $danger?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  font-size: 13px;
  text-align: left;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ $danger, theme }) =>
    $danger ? theme.colors.danger : theme.colors.text};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const AdminBadge = styled.span`
  display: inline-flex;
  vertical-align: middle;
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.primary};
`;

const Empty = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const LimitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  > div:first-child {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  input {
    width: 44px;
    height: 32px;
    padding: 0;
    text-align: center;
    font-weight: 700;
    color: inherit;
    background: transparent;
    border: 1px solid transparent;
    border-radius: ${({ theme }) => theme.radius.sm};
    appearance: textfield;
    -moz-appearance: textfield;

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const StepButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Swatch = styled.button<{ $color: string; $active: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: #fff;
  outline: 2px solid
    ${({ $active, theme }) => ($active ? theme.colors.text : "transparent")};
  outline-offset: 2px;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.1);
  }
`;

const DeleteButton = styled(Button)`
  color: ${({ theme }) => theme.colors.danger};
  border-color: ${({ theme }) => theme.colors.danger};

  &:hover:not(:disabled) {
    color: #fff;
    background: ${({ theme }) => theme.colors.danger};
  }
`;

const ConfirmText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ConfirmDeleteButton = styled(Button)`
  background: ${({ theme }) => theme.colors.danger};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.danger};
    opacity: 0.85;
  }
`;

const ConfirmUser = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  strong {
    display: block;
    font-size: 15px;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const PunishmentInfo = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  margin: 0;
  padding: 12px;
  font-size: 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;

  button {
    flex: 1;
  }
`;

export function RoomSettingsModal({
  chatId,
  settings,
  connectedUsers,
  canEdit = true,
  onClose,
  onSave,
  onDelete,
  isDeleting = false,
  deleteError,
  isSaving = false,
  saveError,
}: RoomSettingsModalProps) {
  const fieldErrors = saveError?.fields ?? {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [name, setName] = useState(settings.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [userLimit, setUserLimit] = useState(settings.userLimit);
  const [limitText, setLimitText] = useState(String(settings.userLimit));
  const [chatBgColor, setChatBgColor] = useState(settings.chatBgColor);
  const [password, setPassword] = useState("");
  const [chatPhoto, setChatPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { blockedUsersQuery, kick, punish, unblock } =
    useRoomModeration(chatId, canEdit);
  const [moderationError, setModerationError] = useState("");
  const [userToPunish, setUserToPunish] = useState<IConnectedUser | null>(null);
  const [userToBlock, setUserToBlock] = useState<IConnectedUser | null>(null);
  const [userToUnblock, setUserToUnblock] = useState<IConnectedUser | null>(
    null,
  );
  const currentUserId = useAuth().user?.id;
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<{
    user: IConnectedUser;
    top: number;
    right: number;
  } | null>(null);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [privacy, setPrivacy] = useState(settings.privacy);
  const isPrivate = privacy === "private";
  const needsPassword = isPrivate && settings.privacy !== "private";
  const photoURL = photoPreview ?? settings.chatPhotoURL;
  const visibleUsers = connectedUsers;
  const blockedUsers = blockedUsersQuery.data ?? [];
  const punishCount = userToPunish?.punishedCount ?? 0;
  const minLimit = Math.max(CHAT_MIN_USERS, visibleUsers.length);
  const isNameValid = name.trim().length >= CHAT_NAME_MIN_LENGTH;
  const isPasswordValid = needsPassword
    ? password.length >= CHAT_PASSWORD_MIN_LENGTH
    : !password || password.length >= CHAT_PASSWORD_MIN_LENGTH;

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!(CHAT_PHOTO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      return setPhotoError("Use uma imagem JPG, PNG ou WEBP");
    }

    if (file.size > CHAT_PHOTO_MAX_SIZE) {
      return setPhotoError("A imagem deve ter no máximo 5 MB");
    }

    setPhotoError("");
    setChatPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function changeLimit(value: number) {
    const next = Math.min(
      CHAT_MAX_USERS,
      Math.max(minLimit, value || minLimit),
    );
    setUserLimit(next);
    setLimitText(String(next));
  }

  const onModerationError = (error: unknown) =>
    setModerationError(getApiErrors(error).message);

  function kickFromRoom(user: IConnectedUser) {
    setModerationError("");
    kick.mutate(user.id, { onError: onModerationError });
  }

  function confirmPunish() {
    if (!userToPunish) return;

    setModerationError("");
    punish.mutate(
      { userId: userToPunish.id, type: "temporary" },
      { onSuccess: () => setUserToPunish(null), onError: onModerationError },
    );
  }

  function confirmBlock() {
    if (!userToBlock) return;

    setModerationError("");
    punish.mutate(
      { userId: userToBlock.id, type: "blocked" },
      { onSuccess: () => setUserToBlock(null), onError: onModerationError },
    );
  }

  function closeConfirm() {
    setUserToPunish(null);
    setUserToBlock(null);
    setUserToUnblock(null);
    setModerationError("");
  }

  function openUserMenu(user: IConnectedUser, button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    setOpenMenu({
      user,
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }

  function runMenuAction(action: (user: IConnectedUser) => void) {
    if (!openMenu) return;

    action(openMenu.user);
    setOpenMenu(null);
  }

  function toggleAdmin(user: IConnectedUser) {
    setAdminUserIds((current) =>
      current.includes(user.id)
        ? current.filter((id) => id !== user.id)
        : [...current, user.id],
    );
  }

  function confirmUnblock() {
    if (!userToUnblock) return;

    setModerationError("");
    unblock.mutate(userToUnblock.id, {
      onSuccess: () => setUserToUnblock(null),
      onError: onModerationError,
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canEdit || !isNameValid || !isPasswordValid) return;

    onSave({
      name: name.trim(),
      privacy,
      userLimit,
      chatBgColor,
      chatPhotoURL: photoURL,
      chatPhoto,
      password: isPrivate ? password : "",
      adminUserIds,
    });
  }

  return (
    <Modal
      title={canEdit ? "Configurações da sala" : "Informações da sala"}
      open
      onClose={onClose}
    >
      <Form onSubmit={handleSubmit}>
        {canEdit ? (
          <>
            <input
              ref={photoInputRef}
              type="file"
              accept={CHAT_PHOTO_ACCEPTED_TYPES.join(",")}
              onChange={handlePhotoChange}
              hidden
            />
            <PhotoButton
              type="button"
              onClick={() => photoInputRef.current?.click()}
              aria-label="Alterar foto da sala"
            >
              <Avatar
                size={96}
                name={name || settings.name}
                src={photoURL ?? undefined}
                color={chatBgColor}
              />
              <span>
                <Camera size={28} />
              </span>
            </PhotoButton>
          </>
        ) : (
          <ReadOnlyPhoto>
            <Avatar
              size={96}
              name={settings.name}
              src={photoURL ?? undefined}
              color={chatBgColor}
            />
          </ReadOnlyPhoto>
        )}
        {(photoError || fieldErrors.chatPhoto) && (
          <FieldError>{photoError || fieldErrors.chatPhoto}</FieldError>
        )}

        {isEditingName ? (
          <Label>
            Nome da sala
            <NameEditor>
              <Input
                value={name}
                maxLength={CHAT_NAME_MAX_LENGTH}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={!isNameValid}
                autoFocus
              />
              <PencilButton
                type="button"
                aria-label="Concluir edição do nome"
                disabled={!isNameValid}
                onClick={() => setIsEditingName(false)}
              >
                <Check size={18} />
              </PencilButton>
            </NameEditor>
            {!isNameValid && (
              <FieldError>
                Mínimo de {CHAT_NAME_MIN_LENGTH} caracteres
              </FieldError>
            )}
            {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
          </Label>
        ) : (
          <NameRow>
            <strong>{name}</strong>
            {canEdit && (
              <PencilButton
                type="button"
                aria-label="Editar nome da sala"
                onClick={() => setIsEditingName(true)}
              >
                <Pencil size={16} />
              </PencilButton>
            )}
          </NameRow>
        )}

        <LimitRow>
          <div>
            {isPrivate ? <Lock size={18} /> : <LockOpen size={18} />}
            <span>
              Sala {isPrivate ? "privada" : "pública"}
              <small>
                {isPrivate ? "Acesso com senha" : "Qualquer um entra"}
              </small>
            </span>
          </div>
          {canEdit && (
            <Switch
              type="button"
              role="switch"
              aria-checked={isPrivate}
              aria-label="Sala privada"
              $checked={isPrivate}
              onClick={() => setPrivacy(isPrivate ? "public" : "private")}
            />
          )}
        </LimitRow>

        <Group>
          <GroupLabel>
            <span>Usuários conectados</span>
            <span>
              {visibleUsers.length}/{userLimit}
            </span>
          </GroupLabel>
          {visibleUsers.length > 0 ? (
            <UserList>
              {visibleUsers.map((user) => (
                <UserRow key={user.id}>
                  <Avatar
                    size={32}
                    name={user.name}
                    src={user.userPhotoURL ?? undefined}
                    color={user.profileBgColor}
                    status={user.status}
                  />
                  <UserInfo>
                    <strong>
                      {user.name}
                      {user.id === currentUserId && " (você)"}
                      {adminUserIds.includes(user.id) && (
                        <AdminBadge title="Administrador">
                          <ShieldCheck size={14} />
                        </AdminBadge>
                      )}
                    </strong>
                    <small>@{user.user}</small>
                  </UserInfo>
                  {canEdit && user.id !== currentUserId && (
                    <RowAction
                      type="button"
                      title="Opções"
                      aria-label={`Opções para ${user.name}`}
                      aria-haspopup="menu"
                      aria-expanded={openMenu?.user.id === user.id}
                      onClick={(event) =>
                        openUserMenu(user, event.currentTarget)
                      }
                    >
                      <ChevronDown size={16} />
                    </RowAction>
                  )}
                </UserRow>
              ))}
            </UserList>
          ) : (
            <Empty>Nenhum usuário conectado</Empty>
          )}
          {moderationError &&
            !userToPunish &&
            !userToBlock &&
            !userToUnblock && <FieldError>{moderationError}</FieldError>}
        </Group>

        {canEdit && blockedUsers.length > 0 && (
          <Group>
            <GroupLabel>Bloqueados</GroupLabel>
            <UserList>
              {blockedUsers.map((user) => (
                <UserRow key={user.id}>
                  <Avatar
                    size={32}
                    name={user.name}
                    src={user.userPhotoURL ?? undefined}
                    color={user.profileBgColor}
                  />
                  <UserInfo>
                    <strong>{user.name}</strong>
                    <small>@{user.user}</small>
                  </UserInfo>
                  <RowAction
                    type="button"
                    title="Desbloquear"
                    aria-label={`Desbloquear ${user.name}`}
                    onClick={() => setUserToUnblock(user)}
                  >
                    <UserCheck size={16} />
                  </RowAction>
                </UserRow>
              ))}
            </UserList>
          </Group>
        )}

        <LimitRow>
          <div>
            <Users size={18} />
            <span>
              Limite de pessoas
              {canEdit && (
                <small>
                  Entre {minLimit} e {CHAT_MAX_USERS}
                </small>
              )}
            </span>
          </div>
          {canEdit ? (
          <Stepper>
            <StepButton
              type="button"
              aria-label="Diminuir limite"
              disabled={userLimit <= minLimit}
              onClick={() => changeLimit(userLimit - 1)}
            >
              <Minus size={16} />
            </StepButton>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Limite de pessoas"
              min={minLimit}
              max={CHAT_MAX_USERS}
              value={limitText}
              onChange={(event) => {
                const text = event.target.value.replace(/D/g, "").slice(0, 2);
                setLimitText(text);
                const value = Number(text);
                if (value >= minLimit && value <= CHAT_MAX_USERS)
                  setUserLimit(value);
              }}
              onBlur={() => changeLimit(Number(limitText))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  changeLimit(Number(limitText));
                }
              }}
            />
            <StepButton
              type="button"
              aria-label="Aumentar limite"
              disabled={userLimit >= CHAT_MAX_USERS}
              onClick={() => changeLimit(userLimit + 1)}
            >
              <Plus size={16} />
            </StepButton>
          </Stepper>
          ) : (
            <strong>{userLimit}</strong>
          )}
        </LimitRow>
        {fieldErrors.userLimit && (
          <FieldError>{fieldErrors.userLimit}</FieldError>
        )}

        {canEdit && isPrivate && (
          <Label>
            {needsPassword ? "Senha da sala" : "Nova senha"}
            <Input
              type="password"
              placeholder={
                needsPassword
                  ? "Senha para entrar na sala"
                  : "Deixe em branco para manter a atual"
              }
              value={password}
              maxLength={CHAT_PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!isPasswordValid}
            />
            <FieldHint>
              Mínimo de {CHAT_PASSWORD_MIN_LENGTH} caracteres
            </FieldHint>
            {fieldErrors.password && (
              <FieldError>{fieldErrors.password}</FieldError>
            )}
          </Label>
        )}

        {canEdit && !photoURL && (
          <Group>
            <GroupLabel>Cor da sala</GroupLabel>
            <Swatches>
              {CHAT_BG_COLORS.map((color) => (
                <Swatch
                  key={color}
                  type="button"
                  $color={color}
                  $active={chatBgColor === color}
                  onClick={() => setChatBgColor(color)}
                  aria-label={`Cor ${color}`}
                >
                  {chatBgColor === color && <Check size={16} />}
                </Swatch>
              ))}
            </Swatches>
          </Group>
        )}

        {onDelete && (
          <DeleteButton
            type="button"
            $variant="ghost"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <Trash2 size={16} />
            Excluir sala
          </DeleteButton>
        )}

        {saveError && !hasFieldErrors && (
          <FieldError>{saveError.message}</FieldError>
        )}

        <Actions>
          {canEdit ? (
            <>
              <Button type="button" $variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isNameValid || !isPasswordValid || isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onClose}>
              Fechar
            </Button>
          )}
        </Actions>
      </Form>

      <Modal
        title="Excluir sala"
        open={!!onDelete && isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
      >
        <ConfirmText>
          Tem certeza que deseja excluir <strong>{settings.name}</strong>? Todos
          os usuários serão desconectados e essa ação não pode ser desfeita.
        </ConfirmText>
        {deleteError && <FieldError>{deleteError}</FieldError>}
        <Actions>
          <Button
            type="button"
            $variant="ghost"
            onClick={() => setIsConfirmingDelete(false)}
          >
            Cancelar
          </Button>
          <ConfirmDeleteButton
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            {isDeleting ? "Excluindo..." : "Excluir"}
          </ConfirmDeleteButton>
        </Actions>
      </Modal>

      {openMenu && (
        <>
          <MenuBackdrop onClick={() => setOpenMenu(null)} />
          <ActionsMenu role="menu" $top={openMenu.top} $right={openMenu.right}>
            <li>
              <MenuItem
                type="button"
                role="menuitem"
                onClick={() => runMenuAction(toggleAdmin)}
              >
                <ShieldPlus size={16} />
                {adminUserIds.includes(openMenu.user.id)
                  ? "Remover administrador"
                  : "Adicionar como administrador"}
              </MenuItem>
            </li>
            <li>
              <MenuItem
                type="button"
                role="menuitem"
                onClick={() => runMenuAction(kickFromRoom)}
              >
                <LogOut size={16} />
                Retirar da sala
              </MenuItem>
            </li>
            <li>
              <MenuItem
                type="button"
                role="menuitem"
                $danger
                onClick={() => runMenuAction(setUserToPunish)}
              >
                <Hourglass size={16} />
                Punir
              </MenuItem>
            </li>
            <li>
              <MenuItem
                type="button"
                role="menuitem"
                $danger
                onClick={() => runMenuAction(setUserToBlock)}
              >
                <Ban size={16} />
                Bloquear
              </MenuItem>
            </li>
          </ActionsMenu>
        </>
      )}

      <Modal title="Punir usuário" open={!!userToPunish} onClose={closeConfirm}>
        {userToPunish && (
          <>
            <ConfirmUser>
              <Avatar
                size={42}
                name={userToPunish.name}
                src={userToPunish.userPhotoURL ?? undefined}
                color={userToPunish.profileBgColor}
              />
              <div>
                <strong>{userToPunish.name}</strong>
                <small>@{userToPunish.user}</small>
              </div>
            </ConfirmUser>
            <PunishmentInfo>
              <dt>Vezes já expulso</dt>
              <dd>{punishCount}</dd>
              <dt>Próxima punição</dt>
              <dd>{getNextPunishment(punishCount)}</dd>
            </PunishmentInfo>
            <ConfirmText>
              O usuário será retirado da sala e só poderá voltar quando o tempo
              da punição acabar. A cada nova punição o tempo aumenta: 5 minutos,
              15 minutos, 1 hora e, por fim, bloqueio.
            </ConfirmText>
            {moderationError && <FieldError>{moderationError}</FieldError>}
            <Actions>
              <Button type="button" $variant="ghost" onClick={closeConfirm}>
                Cancelar
              </Button>
              <ConfirmDeleteButton
                type="button"
                onClick={confirmPunish}
                disabled={punish.isPending}
              >
                <Hourglass size={16} />
                {punish.isPending ? "Punindo..." : "Punir"}
              </ConfirmDeleteButton>
            </Actions>
          </>
        )}
      </Modal>

      <Modal
        title="Bloquear usuário"
        open={!!userToBlock}
        onClose={closeConfirm}
      >
        {userToBlock && (
          <>
            <ConfirmUser>
              <Avatar
                size={42}
                name={userToBlock.name}
                src={userToBlock.userPhotoURL ?? undefined}
                color={userToBlock.profileBgColor}
              />
              <div>
                <strong>{userToBlock.name}</strong>
                <small>@{userToBlock.user}</small>
              </div>
            </ConfirmUser>
            <ConfirmText>
              <strong>{userToBlock.name}</strong> não poderá mais entrar nesta
              sala enquanto não for desbloqueado.
            </ConfirmText>
            {moderationError && <FieldError>{moderationError}</FieldError>}
            <Actions>
              <Button type="button" $variant="ghost" onClick={closeConfirm}>
                Cancelar
              </Button>
              <ConfirmDeleteButton
                type="button"
                onClick={confirmBlock}
                disabled={punish.isPending}
              >
                <Ban size={16} />
                {punish.isPending ? "Bloqueando..." : "Bloquear"}
              </ConfirmDeleteButton>
            </Actions>
          </>
        )}
      </Modal>

      <Modal
        title="Desbloquear usuário"
        open={!!userToUnblock}
        onClose={closeConfirm}
      >
        {userToUnblock && (
          <>
            <ConfirmUser>
              <Avatar
                size={42}
                name={userToUnblock.name}
                src={userToUnblock.userPhotoURL ?? undefined}
                color={userToUnblock.profileBgColor}
              />
              <div>
                <strong>{userToUnblock.name}</strong>
                <small>@{userToUnblock.user}</small>
              </div>
            </ConfirmUser>
            <ConfirmText>
              <strong>{userToUnblock.name}</strong> poderá entrar nesta sala
              novamente e o histórico de punições será zerado: a próxima punição
              volta a ser de 5 minutos.
            </ConfirmText>
            {moderationError && <FieldError>{moderationError}</FieldError>}
            <Actions>
              <Button type="button" $variant="ghost" onClick={closeConfirm}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={confirmUnblock}
                disabled={unblock.isPending}
              >
                <UserCheck size={16} />
                {unblock.isPending ? "Desbloqueando..." : "Desbloquear"}
              </Button>
            </Actions>
          </>
        )}
      </Modal>
    </Modal>
  );
}
