import { useContext } from "react";
import { ChatListContext } from "../context/chatListContextInstance";

export const useChatList = () => {
  const context = useContext(ChatListContext);

  if (!context) {
    throw new Error("useChatList deve ser usado dentro de um ChatListProvider");
  }

  return context;
};
