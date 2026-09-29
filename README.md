# Real Time Chat

Monorepo gerenciado com **Yarn Workspaces**.

```
.
├── frontend/   # App React + Vite + TypeScript
└── backend/    # API / servidor de tempo real (Node + TypeScript)
```

## Primeiros passos

```bash
yarn install
yarn dev:frontend
```

## Scripts da raiz

| Script           | O que faz                     |
| ---------------- | ----------------------------- |
| `dev:frontend`   | Roda o Vite em modo dev       |
| `build:frontend` | Build de produção do frontend |
| `lint:frontend`  | ESLint no frontend            |
| `build:backend`  | Compila o backend com `tsc`   |

Para rodar qualquer script de um workspace específico:

```bash
yarn workspace @real-time-chat/frontend <script>
yarn workspace @real-time-chat/backend <script>
```

Para adicionar dependências a um workspace:

```bash
yarn workspace @real-time-chat/backend add <pacote>
```
