import { createContext } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type {
  IPublicUser,
  IUpdateUserDTO,
  IUserProfileFields,
} from "../model/userModel";

export interface IUserUpdateContext {
  updateDTO: IUserProfileFields;
  changedFields: IUpdateUserDTO;
  hasChanges: boolean;
  applyUpdateChanges: <K extends keyof IUserProfileFields>(
    field: K,
    value: IUserProfileFields[K],
  ) => void;
  resetUpdateDTO: () => void;
  updateUserMutation: UseMutateFunction<IPublicUser, Error, IUpdateUserDTO>;
  isUpdatePending: boolean;
  updateError: boolean;
}

export const UserUpdateContext = createContext<IUserUpdateContext | null>(null);
