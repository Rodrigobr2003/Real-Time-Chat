import { createContext } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { IPublicUser, IUserDTO } from "../model/userModel";

export interface IUserContext {
  userDTO: IUserDTO;
  applyDTOChanges: (field: string, value: string) => void;
  clearDTOFields: () => void;
  createUserMutation: UseMutateFunction<IPublicUser, Error, IUserDTO>;
  isCreationPending: boolean;
  creationError: boolean;
  logoutMutation: UseMutateFunction<void, Error, void>;
  isLogoutPending: boolean;
}

export const UserContext = createContext<IUserContext | null>(null);
