import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "./userContex";

interface IGlobalContexts {
  children: React.ReactNode;
}

// Criado fora do componente para não ser recriado a cada render.
const queryClient = new QueryClient();

export const GlobalContexts = ({ children }: IGlobalContexts) => {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>{children}</UserProvider>
    </QueryClientProvider>
  );
};
