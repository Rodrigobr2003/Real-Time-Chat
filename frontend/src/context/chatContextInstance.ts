import { createContext } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type {
  IConnectChatDTO,
  ICreateChatDTO,
  IPublicChat,
} from "../model/chatModel";

export interface IChatContext {
  createChatDTO: ICreateChatDTO;
  applyCreateChatChanges: <K extends keyof ICreateChatDTO>(
    field: K,
    value: ICreateChatDTO[K],
  ) => void;
  resetCreateChatDTO: () => void;
  createChatMutation: UseMutateFunction<IPublicChat, Error, ICreateChatDTO>;
  isCreatePending: boolean;
  connectChatMutation: UseMutateFunction<void, Error, IConnectChatDTO>;
  isConnectPending: boolean;
}

export const ChatContext = createContext<IChatContext | null>(null);
