import { createContext } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { ILoginDTO } from "../api/auth";
import type { IPublicUser } from "../model/userModel";

export const ME_QUERY_KEY = ["me"] as const;

export interface IAuthContext {
  user: IPublicUser | null;
  isCheckingSession: boolean;
  loginMutation: UseMutateFunction<IPublicUser, Error, ILoginDTO>;
  isLoginPending: boolean;
  logoutMutation: UseMutateFunction<void, Error, void>;
  isLogoutPending: boolean;
}

export const AuthContext = createContext<IAuthContext | null>(null);
