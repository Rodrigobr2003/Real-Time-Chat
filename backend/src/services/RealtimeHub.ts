import {
  IChatRepository,
  MongoChatRepository,
} from "@repositories/ChatRepository";
import { AuthenticatedSocket } from "@typings/auth";
import { ServerEvent } from "@typings/realtime";

export interface IRealtimePublisher {
  publish(chatId: string, event: ServerEvent): void;
  publishToList(event: ServerEvent): void;
}

export class RealtimeHub implements IRealtimePublisher {
  private readonly rooms = new Map<string, Set<AuthenticatedSocket>>();
  private readonly listSubscribers = new Set<AuthenticatedSocket>();

  constructor(private readonly chatRepository: IChatRepository) {}

  async join(socket: AuthenticatedSocket, chatId: string) {
    const isConnected = await this.chatRepository.verifyConnectionStatus({
      userId: socket.userId,
      chatId,
    });

    if (!isConnected) return false;

    const room = this.rooms.get(chatId) ?? new Set();

    room.add(socket);
    this.rooms.set(chatId, room);

    return true;
  }

  leave(socket: AuthenticatedSocket, chatId: string) {
    const room = this.rooms.get(chatId);

    room?.delete(socket);

    if (room?.size === 0) this.rooms.delete(chatId);
  }

  leaveAll(socket: AuthenticatedSocket) {
    for (const chatId of this.rooms.keys()) this.leave(socket, chatId);
    this.unsubscribeList(socket);
  }

  publish(chatId: string, event: ServerEvent) {
    const room = this.rooms.get(chatId);

    if (!room) return;

    const data = JSON.stringify(event);

    for (const socket of room) {
      if (socket.readyState === socket.OPEN) socket.send(data);
    }
  }

  subscribeList(socket: AuthenticatedSocket) {
    this.listSubscribers.add(socket);
  }

  unsubscribeList(socket: AuthenticatedSocket) {
    this.listSubscribers.delete(socket);
  }

  publishToList(event: ServerEvent) {
    const data = JSON.stringify(event);

    for (const socket of this.listSubscribers) {
      if (socket.readyState === socket.OPEN) socket.send(data);
    }
  }
}

export const realtimeHub = new RealtimeHub(new MongoChatRepository());
