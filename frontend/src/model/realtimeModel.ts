import type { IMessage } from "./messageModel";

export type ClientEvent =
  | { type: "room:join"; chatId: string }
  | { type: "room:leave"; chatId: string }
  | { type: "rooms:subscribe" }
  | { type: "rooms:unsubscribe" };

export type ServerEvent =
  | { type: "message:created"; message: IMessage }
  | { type: "message:updated"; message: IMessage }
  | { type: "message:deleted"; message: IMessage }
  | { type: "room:lastMessage"; chatId: string; message: IMessage }
  | { type: "error"; message: string };
