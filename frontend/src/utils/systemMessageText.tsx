import { Fragment, type ReactNode } from "react";
import type { ISystemChatMessage } from "../model/messageModel";
import type { RoomTarget } from "../model/realtimeModel";
import type {
  ChatChange,
  ISystemActor,
  SystemEvent,
} from "../model/systemMessageModel";

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const joinList = (items: ReactNode[]) =>
  items.map((item, index) => (
    <Fragment key={index}>
      {index > 0 && (index === items.length - 1 ? " e " : ", ")}
      {item}
    </Fragment>
  ));

const describeChange = (change: ChatChange): ReactNode => {
  switch (change.field) {
    case "name":
      return (
        <>
          mudou o nome da sala de <b>"{change.from}"</b> para{" "}
          <b>"{change.to}"</b>
        </>
      );
    case "privacy":
      return `tornou a sala ${change.to === "private" ? "privada" : "pública"}`;
    case "userLimit":
      return `alterou o limite de pessoas de ${change.from} para ${change.to}`;
    case "photo":
      return "mudou a foto da sala";
    case "color":
      return "mudou a cor da sala";
    case "password":
      return "alterou a senha da sala";
  }
};

const toActor = ({ id, name }: RoomTarget): ISystemActor => ({
  id,
  name: name ?? "um usuário",
});

export const toSystemEvent = ({
  owner,
  system,
}: ISystemChatMessage): SystemEvent => {
  const actor = { id: owner.id, name: owner.name };

  switch (system.type) {
    case "chat:updated":
      return { type: "chat:updated", actor, changes: system.changes };
    case "chat:deleted":
      return { type: "chat:deleted", actor, deletesAt: null };
    case "admin:added":
      return { type: "admins:added", actor, targets: [toActor(system.target)] };
    case "user:kicked":
      return {
        type: "user:kicked",
        actor,
        target: toActor(system.target),
        expiresAt: system.expiresAt,
      };
    default:
      return { type: system.type, actor, target: toActor(system.target) };
  }
};

export const getSystemMessageText = (
  event: SystemEvent,
  currentUserId: string | undefined,
): ReactNode => {
  const isMe = (person: ISystemActor) => person.id === currentUserId;

  const subject = (person: ISystemActor) =>
    isMe(person) ? "Você" : <b>{person.name}</b>;

  const object = (person: ISystemActor) =>
    isMe(person) ? "você" : <b>{person.name}</b>;

  switch (event.type) {
    case "user:kicked":
      return (
        <>
          {subject(event.actor)} baniu {object(event.target)} temporariamente
          {event.expiresAt && <> até as {formatTime(event.expiresAt)}</>}
        </>
      );

    case "user:blocked":
      return (
        <>
          {subject(event.actor)} baniu {object(event.target)}
        </>
      );

    case "user:unblocked":
      return (
        <>
          {subject(event.actor)} desbaniu {object(event.target)}
        </>
      );

    case "user:removed":
      return (
        <>
          {subject(event.actor)} removeu {object(event.target)}
        </>
      );

    case "user:joined":
      return <>{subject(event.target)} entrou na sala</>;

    case "user:left":
      return <>{subject(event.target)} saiu da sala</>;

    case "admins:added": {
      if (event.targets.length === 1 && isMe(event.targets[0])) {
        return (
          <>
            {subject(event.actor)} tornou você admin. Agora você pode gerenciar
            a sala
          </>
        );
      }

      return (
        <>
          {subject(event.actor)} tornou {joinList(event.targets.map(object))}{" "}
          {event.targets.length > 1 ? "admins" : "admin"}
        </>
      );
    }

    case "admin:removed":
      return (
        <>
          {subject(event.actor)} removeu {object(event.target)} como admin
        </>
      );

    case "chat:updated":
      return (
        <>
          {subject(event.actor)} {joinList(event.changes.map(describeChange))}
        </>
      );

    case "chat:deleted":
      return (
        <>
          {subject(event.actor)} excluiu esta sala
          {event.deletesAt ? (
            <>
              . Ela será apagada em <b>{formatDateTime(event.deletesAt)}</b>
            </>
          ) : (
            ". As mensagens não poderão mais ser enviadas"
          )}
        </>
      );
  }
};
