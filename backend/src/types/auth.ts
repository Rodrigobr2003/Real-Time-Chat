import type { PublicUser } from "./user";

// O front manda um único campo: pode ser o e-mail ou o nome de usuário.
export interface LoginInput {
  userOrEmail: string;
  password: string;
}

export type LoginIdentifier =
  | { type: "email"; value: string }
  | { type: "user"; value: string };

// Usado só dentro do auth: é o único lugar que precisa do hash.
export interface AuthUser {
  user: PublicUser;
  passwordHash: string;
}
