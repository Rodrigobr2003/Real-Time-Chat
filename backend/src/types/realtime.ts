import type { PublicMessage } from "./message";

export type ClientEvent =
  | { type: "room:join"; chatId: string }
  | { type: "room:leave"; chatId: string };

export type ServerEvent =
  | { type: "message:created"; message: PublicMessage }
  | { type: "message:updated"; message: PublicMessage }
  | { type: "message:deleted"; message: PublicMessage }
  | { type: "error"; message: string };
