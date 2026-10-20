import { useCallback, useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { listChats } from "../api/chatHelpers";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  INITIAL_CHAT_FILTERS,
  type IChatFilters,
  type IListChatsParams,
  type PeopleFilter,
} from "../model/chatModel";
import {
  CHATS_QUERY_KEY,
  ChatListContext,
  type IChatListContext,
} from "./chatListContextInstance";

interface IChatListProvider {
  children: ReactNode;
}

type ChatListQuery = Omit<IListChatsParams, "skip" | "limit">;

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const POLLING_INTERVAL_MS = 5000;

const PEOPLE_RANGES: Record<PeopleFilter, ChatListQuery> = {
  any: {},
  "1-2": { minUsers: 1, maxUsers: 2 },
  "3-5": { minUsers: 3, maxUsers: 5 },
  "6-10": { minUsers: 6, maxUsers: 10 },
  "10+": { minUsers: 11 },
};

const toListQuery = (
  { visibility, people, onlyAvailable }: IChatFilters,
  search: string,
): ChatListQuery => ({
  ...(visibility !== "all" && { privacy: visibility }),
  ...PEOPLE_RANGES[people],
  ...(onlyAvailable && { notFull: true }),
  ...(search && { name: search }),
});

export const ChatListProvider = ({ children }: IChatListProvider) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<IChatFilters>(INITIAL_CHAT_FILTERS);
  const [isChatsPolling, setChatsPolling] = useState(false);

  const search = useDebouncedValue(filters.search.trim(), SEARCH_DEBOUNCE_MS);

  const listQuery = useMemo(
    () => toListQuery(filters, search),
    [filters, search],
  );

  const hasActiveFilters = (
    Object.keys(INITIAL_CHAT_FILTERS) as (keyof IChatFilters)[]
  ).some((key) => filters[key] !== INITIAL_CHAT_FILTERS[key]);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_CHAT_FILTERS);
  }, []);

  const {
    data,
    isPending: isListPending,
    isError: isListError,
    refetch,
    fetchNextPage,
    hasNextPage: hasNextChatsPage,
    isFetchingNextPage: isFetchingNextChatsPage,
  } = useInfiniteQuery({
    queryKey: [...CHATS_QUERY_KEY, "list", listQuery],
    queryFn: ({ pageParam }) =>
      listChats({ ...listQuery, skip: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (count, page) => count + page.chats.length,
        0,
      );
      return loaded < lastPage.total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
    enabled: !!user,
    refetchInterval: isChatsPolling ? POLLING_INTERVAL_MS : false,
  });

  const chats = useMemo(
    () => data?.pages.flatMap((page) => page.chats) ?? [],
    [data],
  );
  const totalChats = data?.pages.at(-1)?.total ?? 0;

  const refetchChats = useCallback(() => {
    refetch();
  }, [refetch]);

  const fetchNextChatsPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const value = useMemo<IChatListContext>(
    () => ({
      filters,
      setFilters,
      resetFilters,
      hasActiveFilters,
      chats,
      totalChats,
      isListPending,
      isListError,
      refetchChats,
      fetchNextChatsPage,
      hasNextChatsPage,
      isFetchingNextChatsPage,
      setChatsPolling,
    }),
    [
      filters,
      resetFilters,
      hasActiveFilters,
      chats,
      totalChats,
      isListPending,
      isListError,
      refetchChats,
      fetchNextChatsPage,
      hasNextChatsPage,
      isFetchingNextChatsPage,
    ],
  );

  return (
    <ChatListContext.Provider value={value}>
      {children}
    </ChatListContext.Provider>
  );
};
