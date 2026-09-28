export type Message = {
  id: string;
  author: string;
  content: string;
  sentAt: string;
  mine: boolean;
};

export const mockMessages: Message[] = [
  { id: "1", author: "Máquina B", content: "Olá! Conexão estabelecida 👋", sentAt: "14:02", mine: false },
  { id: "2", author: "Você", content: "Opa! Tudo certo por aqui, recebendo bem?", sentAt: "14:03", mine: true },
  { id: "3", author: "Máquina B", content: "Sim, chegando em tempo real.", sentAt: "14:03", mine: false },
  {
    id: "4",
    author: "Você",
    content:
      "Perfeito, vamos testar mensagens maiores para ver como o layout se comporta quando o texto quebra em várias linhas.",
    sentAt: "14:05",
    mine: true,
  },
];
