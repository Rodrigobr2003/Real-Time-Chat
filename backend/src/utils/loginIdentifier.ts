import type { LoginIdentifier } from "@typings/auth";

export const parseLoginIdentifier = (userOrEmail: string): LoginIdentifier => {
  const value = userOrEmail.trim().toLowerCase();

  return value.includes("@")
    ? { type: "email", value }
    : { type: "user", value };
};
