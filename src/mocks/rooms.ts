export type Room = {
  id: string;
  name: string;
  isPrivate: boolean;
  members: number;
  maxMembers: number;
  lastMessage: string;
  lastActivity: string;
};

export const mockRooms: Room[] = [
  { id: "XK42-9B", name: "Suporte Técnico", isPrivate: false, members: 2, maxMembers: 2, lastMessage: "Conexão estabelecida!", lastActivity: "14:05" },
  { id: "PL88-3C", name: "Projeto Alpha", isPrivate: true, members: 4, maxMembers: 6, lastMessage: "Enviei os arquivos agora", lastActivity: "13:40" },
  { id: "ZT11-7D", name: "Geral", isPrivate: false, members: 12, maxMembers: 20, lastMessage: "Alguém online?", lastActivity: "12:18" },
  { id: "QW09-1A", name: "Financeiro", isPrivate: true, members: 3, maxMembers: 3, lastMessage: "Relatório fechado", lastActivity: "Ontem" },
  { id: "MN55-4E", name: "Testes de Rede", isPrivate: false, members: 1, maxMembers: 5, lastMessage: "Latência em 12ms", lastActivity: "Ontem" },
  { id: "RB23-8F", name: "Servidor Backup", isPrivate: true, members: 1, maxMembers: 2, lastMessage: "Backup concluído", lastActivity: "Seg" },
  { id: "HJ77-2G", name: "Bate-papo Livre", isPrivate: false, members: 8, maxMembers: 10, lastMessage: "Até amanhã!", lastActivity: "Dom" },
];
