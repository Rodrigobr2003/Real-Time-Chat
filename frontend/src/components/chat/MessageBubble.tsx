import styled from "styled-components";
import type { Message } from "../../mocks/messages";

const Row = styled.div<{ $mine: boolean }>`
  display: flex;
  justify-content: ${({ $mine }) => ($mine ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div<{ $mine: boolean }>`
  max-width: min(70%, 520px);
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.lg};
  ${({ $mine }) =>
    $mine ? "border-bottom-right-radius: 4px;" : "border-bottom-left-radius: 4px;"}
  background: ${({ $mine, theme }) =>
    $mine ? theme.colors.bubbleMine : theme.colors.bubbleTheirs};
  color: ${({ $mine, theme }) => ($mine ? "#fff" : theme.colors.text)};
  line-height: 1.4;
  overflow-wrap: anywhere;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: 85%;
  }
`;

const Time = styled.time`
  display: block;
  margin-top: 4px;
  font-size: 11px;
  text-align: right;
  opacity: 0.7;
`;

export function MessageBubble({ message }: { message: Message }) {
  return (
    <Row $mine={message.mine}>
      <Bubble $mine={message.mine}>
        {message.content}
        <Time>{message.sentAt}</Time>
      </Bubble>
    </Row>
  );
}
