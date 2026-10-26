import type { PublicUser } from "./user";
import type { WebSocket } from "ws";

export interface LoginInput {
  userOrEmail: string;
  password: string;
}

export type LoginIdentifier =
  | { type: "email"; value: string }
  | { type: "user"; value: string };

export interface AuthUser {
  user: PublicUser;
  passwordHash: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedSocket extends WebSocket {
  userId: string;
}
