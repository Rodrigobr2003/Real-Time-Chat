import type React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GOOGLE_CLIENT_ID } from "../utils/googleAuth";
import { AuthProvider } from "./authContext";
import { ChatProvider } from "./chatContext";
import { ChatListProvider } from "./chatListContext";
import { UserProvider } from "./userContex";
import { UserUpdateProvider } from "./userUpdateContext";

interface IGlobalContexts {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

const GoogleProvider = ({ children }: IGlobalContexts) =>
  GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="pt-BR">
      {children}
    </GoogleOAuthProvider>
  ) : (
    children
  );

export const GlobalContexts = ({ children }: IGlobalContexts) => {
  return (
    <GoogleProvider>
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
    </GoogleProvider>
  );
};
