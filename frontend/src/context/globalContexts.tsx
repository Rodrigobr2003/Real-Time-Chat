import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./authContext";
import { ChatProvider } from "./chatContext";
import { ChatListProvider } from "./chatListContext";
import { UserProvider } from "./userContex";
import { UserUpdateProvider } from "./userUpdateContext";

interface IGlobalContexts {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

export const GlobalContexts = ({ children }: IGlobalContexts) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <UserUpdateProvider>
            <ChatListProvider>
              <ChatProvider>{children}</ChatProvider>
            </ChatListProvider>
          </UserUpdateProvider>
        </UserProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
