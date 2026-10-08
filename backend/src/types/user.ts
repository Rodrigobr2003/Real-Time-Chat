import type { Status } from "@models/userSchema";

export type UserDoc = {
  _id: { toString(): string };
  accountId: string;
  name: string;
  user: string;
  email: string;
  description?: string | null;
  userPhoto?: { toString(encoding: "base64"): string } | null;
  status?: Status | null;
  profileBgColor?: string | null;
  createdAt: Date;
};

export interface CreateUserInput {
  name: string;
  user: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  user?: string;
  email?: string;
  description?: string;
  status?: Status;
  profileBgColor?: string;
  userPhoto?: Buffer | null;
}

export interface NewUser {
  name: string;
  user: string;
  email: string;
  passwordHash: string;
}

export interface PublicUser {
  id: string;
  accountId: string;
  name: string;
  user: string;
  email: string;
  description: string;
  userPhotoURL: string | null;
  status: Status;
  profileBgColor: string;
  createdAt: Date;
}
