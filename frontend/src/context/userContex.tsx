import { useMemo, type ReactNode } from "react";
import { UserContext, type IUserContext } from "./userContextInstance";

interface IUserProvider {
  children: ReactNode;
}

export const UserProvider = ({ children }: IUserProvider) => {
  const value = useMemo<IUserContext>(() => ({}), []);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
