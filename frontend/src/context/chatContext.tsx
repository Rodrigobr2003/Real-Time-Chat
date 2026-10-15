import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { connectChat, createChat } from "../api/chatHelpers";
import {
  CHAT_BG_COLORS,
  CHAT_MIN_USERS,
  type ICreateChatDTO,
} from "../model/chatModel";
import { ChatContext, type IChatContext } from "./chatContextInstance";
import { CHATS_QUERY_KEY } from "./chatListContextInstance";

interface IChatProvider {
  children: ReactNode;
}

const INITIAL_CREATE_CHAT: ICreateChatDTO = {
  name: "",
  userLimit: CHAT_MIN_USERS,
  privacy: "public",
  chatBgColor: CHAT_BG_COLORS[0],
  chatPhoto: null,
  password: "",
};

export const ChatProvider = ({ children }: IChatProvider) => {
  const queryClient = useQueryClient();
  const [createChatDTO, setCreateChatDTO] =
    useState<ICreateChatDTO>(INITIAL_CREATE_CHAT);

  const applyCreateChatChanges = useCallback(
    <K extends keyof ICreateChatDTO>(field: K, value: ICreateChatDTO[K]) => {
      setCreateChatDTO((data) => ({ ...data, [field]: value }));
    },
    [],
  );

  const resetCreateChatDTO = useCallback(() => {
    setCreateChatDTO(INITIAL_CREATE_CHAT);
  }, []);

  const { mutate: createChatMutation, isPending: isCreatePending } =
    useMutation({
      mutationFn: createChat,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
        resetCreateChatDTO();
      },
    });

  const { mutate: connectChatMutation, isPending: isConnectPending } =
    useMutation({
      mutationFn: connectChat,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY }),
    });

  const value = useMemo<IChatContext>(
    () => ({
      createChatDTO,
      applyCreateChatChanges,
      resetCreateChatDTO,
      createChatMutation,
      isCreatePending,
      connectChatMutation,
      isConnectPending,
    }),
    [
      createChatDTO,
      applyCreateChatChanges,
      resetCreateChatDTO,
      createChatMutation,
      isCreatePending,
      connectChatMutation,
      isConnectPending,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
