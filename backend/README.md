# Backend

Estrutura base do servidor. Nenhum servidor foi implementado ainda.

```
backend/
├── src/
│   ├── config/        # Variáveis de ambiente, configurações de DB, CORS etc.
│   ├── controllers/   # Recebem a requisição, chamam os services e devolvem a resposta
│   ├── routes/        # Definição das rotas HTTP e ligação com os controllers
│   ├── services/      # Regras de negócio (independentes do HTTP/WebSocket)
│   ├── models/        # Entidades / schemas do banco de dados
│   ├── middlewares/   # Autenticação, validação, tratamento de erros...
│   ├── sockets/       # Handlers de eventos em tempo real (salas, mensagens, presença)
│   ├── utils/         # Funções auxiliares reutilizáveis
│   └── types/         # Tipos e interfaces TypeScript compartilhados
├── tests/             # Testes
├── .env.example       # Modelo das variáveis de ambiente
├── package.json
└── tsconfig.json
```

## Próximos passos sugeridos

1. Copiar `.env.example` para `.env`.
2. Criar o ponto de entrada (ex.: `src/server.ts`).
3. Adicionar as dependências que escolher: `yarn workspace @real-time-chat/backend add <pacote>`.
4. Adicionar scripts `dev` / `start` no `package.json`.
