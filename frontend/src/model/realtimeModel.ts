import type { IPublicChat } from "./chatModel";
import type { IMessage } from "./messageModel";
import type { ChatChange } from "./systemMessageModel";

export type RoomTarget = { id: string; name: string | null };

type RoomAction = { chatId: string; actorId: string };

type UserAction = RoomAction & { target: RoomTarget };

export type ClientEvent =
  | { type: "room:join" | "room:leave"; chatId: string }
  | { type: "rooms:subscribe" | "rooms:unsubscribe" };

type MessageEvent = {
  type: "message:created" | "message:updated" | "message:deleted";
  message: IMessage;
};

type RoomListEvent = {
  type: "room:lastMessage";
  chatId: string;
  message: IMessage;
};

type RoomEvent =
  | (RoomAction & {
      type: "room:updated";
      chat: IPublicChat;
      changes: ChatChange[];
    })
  | (RoomAction & { type: "room:promote-admin"; userIdToPromote: string })
  | (RoomAction & { type: "room:demote-admin"; userIdToDemote: string })
  | (RoomAction & { type: "room:deleted" });

type ModerationEvent =
  | (UserAction & {
      type: "room:remove" | "room:permanent-ban" | "room:remove-ban";
    })
  | (UserAction & { type: "room:temporary-ban"; expiresAt: string | null });

type ErrorEvent = { type: "error"; message: string };

export type ServerEvent =
  | MessageEvent
  | RoomListEvent
  | RoomEvent
  | ModerationEvent
  | ErrorEvent;
