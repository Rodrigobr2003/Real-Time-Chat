import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./authContext";
import { UserProvider } from "./userContex";
import { UserUpdateProvider } from "./userUpdateContext";

interface IGlobalContexts {
  children: React.ReactNode;
}

// Criado fora do componente para não ser recriado a cada render.
const queryClient = new QueryClient();

export const GlobalContexts = ({ children }: IGlobalContexts) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <UserUpdateProvider>{children}</UserUpdateProvider>
        </UserProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
