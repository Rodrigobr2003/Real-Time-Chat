import type React from "react";
import { UserProvider } from "./userContex";

interface IGlobalContexts {
  children: React.ReactNode;
}

export const GlobalContexts = ({ children }: IGlobalContexts) => {
  return (
    <>
      <UserProvider>{children}</UserProvider>
    </>
  );
};
