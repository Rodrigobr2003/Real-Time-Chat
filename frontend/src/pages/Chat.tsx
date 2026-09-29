import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageBubble } from "../components/chat/MessageBubble";
import { MessageInput } from "../components/chat/MessageInput";
import { mockMessages } from "../mocks/messages";
import { mockRooms } from "../mocks/rooms";

const Page = styled.main`
  height: 100%;
  display: flex;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`;

const Container = styled.div`
  width: 100%;
  max-width: 900px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-inline: 1px solid ${({ theme }) => theme.colors.border};
`;

const Messages = styled.section`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 16px;
`;

const DayTag = styled.span`
  align-self: center;
  margin-bottom: 8px;
  padding: 4px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export default function Chat() {
  const navigate = useNavigate();
  const { roomId = "" } = useParams();
  const [text, setText] = useState("");
  const room = mockRooms.find((item) => item.id === roomId);

  return (
    <Page>
      <Container>
        <ChatHeader
          roomName={room?.name ?? "Sala"}
          roomId={roomId}
          isPrivate={room?.isPrivate ?? false}
          members={room?.members ?? 1}
          maxMembers={room?.maxMembers ?? 2}
          onBack={() => navigate("/home")}
        />

        <Messages>
          <DayTag>Hoje</DayTag>
          {mockMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </Messages>

        <MessageInput value={text} onChange={setText} onSend={() => setText("")} />
      </Container>
    </Page>
  );
}
