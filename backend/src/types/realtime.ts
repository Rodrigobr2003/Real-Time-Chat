import type { ChatPrivacy } from "@models/chatSchema";
import type { PublicChat } from "./chat";
import type { PublicMessage } from "./message";

export type RoomChange =
  | { field: "name"; from: string; to: string }
  | { field: "privacy"; to: ChatPrivacy }
  | { field: "userLimit"; from: number; to: number }
  | { field: "photo" | "color" | "password" };

export type RoomTarget = { id: string; name: string | null };

type RoomAction = { chatId: string; actorId: string };

type UserAction = RoomAction & { target: RoomTarget };

export type ClientEvent =
  | { type: "room:join" | "room:leave"; chatId: string }
  | { type: "rooms:subscribe" | "rooms:unsubscribe" };

type MessageEvent = {
  type: "message:created" | "message:updated" | "message:deleted";
  message: PublicMessage;
};

type RoomListEvent = {
  type: "room:lastMessage";
  chatId: string;
  message: PublicMessage;
};

type RoomEvent =
  | (RoomAction & {
      type: "room:updated";
      chat: PublicChat;
      changes: RoomChange[];
    })
  | (RoomAction & { type: "room:promote-admin"; userIdToPromote: string })
  | (RoomAction & { type: "room:demote-admin"; userIdToDemote: string })
  | (RoomAction & { type: "room:deleted" });

type ModerationEvent =
  | (UserAction & {
      type: "room:remove" | "room:permanent-ban" | "room:remove-ban";
    })
  | (UserAction & { type: "room:temporary-ban"; expiresAt: Date | null });

type ErrorEvent = { type: "error"; message: string };

export type ServerEvent =
  | MessageEvent
  | RoomListEvent
  | RoomEvent
  | ModerationEvent
  | ErrorEvent;
