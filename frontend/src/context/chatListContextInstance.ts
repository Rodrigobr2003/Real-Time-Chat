import { createContext } from "react";
import type { IChatFilters, IPublicChat } from "../model/chatModel";

export const CHATS_QUERY_KEY = ["chats"] as const;

export interface IChatListContext {
  filters: IChatFilters;
  setFilters: (filters: IChatFilters) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  chats: IPublicChat[];
  totalChats: number;
  isListPending: boolean;
  isListError: boolean;
  refetchChats: () => void;
  fetchNextChatsPage: () => void;
  hasNextChatsPage: boolean;
  isFetchingNextChatsPage: boolean;
}

export const ChatListContext = createContext<IChatListContext | null>(null);
