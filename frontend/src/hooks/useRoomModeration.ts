import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  kickUser,
  demoteUser,
  listBlockedUsers,
  promoteUser,
  punishUser,
  unblockUser,
} from "../api/chatHelpers";
import { CHATS_QUERY_KEY } from "../context/chatListContextInstance";
import type { PunishmentType } from "../model/chatModel";

export const useRoomModeration = (chatId: string, enabled = true) => {
  const queryClient = useQueryClient();
  const roomKey = [...CHATS_QUERY_KEY, chatId];

  const blockedUsersQuery = useQuery({
    queryKey: [...roomKey, "blocked-users"],
    queryFn: () => listBlockedUsers(chatId),
    enabled: !!chatId && enabled,
  });

  const onSuccess = () => queryClient.invalidateQueries({ queryKey: roomKey });

  const kick = useMutation({
    mutationFn: (userId: string) => kickUser(chatId, userId),
    onSuccess,
  });

  const punish = useMutation({
    mutationFn: ({ userId, type }: { userId: string; type: PunishmentType }) =>
      punishUser(chatId, userId, type),
    onSuccess,
  });

  const unblock = useMutation({
    mutationFn: (userId: string) => unblockUser(chatId, userId),
    onSuccess,
  });

  const promote = useMutation({
    mutationFn: (userId: string) => promoteUser(chatId, userId),
    onSuccess,
  });

  const demote = useMutation({
    mutationFn: (userId: string) => demoteUser(chatId, userId),
    onSuccess,
  });

  return { blockedUsersQuery, kick, punish, unblock, promote, demote };
};
