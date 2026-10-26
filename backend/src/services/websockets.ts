import type { IncomingMessage, Server } from "http";
import type { Duplex } from "stream";
import { WebSocketServer } from "ws";
import { parse } from "cookie";
import { TOKEN_COOKIE, verifyTokenPayload, type TokenSession } from "@utils/jwt";
import type { AuthenticatedSocket } from "@typings/auth";

const WS_PATH = "/ws";

const reject = (socket: Duplex, status: number, message: string) => {
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
};

export const websockets = (server: Server) => {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 });

  server.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const { pathname } = new URL(req.url ?? "", "http://localhost");

    if (pathname !== WS_PATH) {
      socket.destroy();
      return;
    }

    if (req.headers.origin !== process.env.CLIENT_URL) {
      reject(socket, 403, "Forbidden");
      return;
    }

    const token = parse(req.headers.cookie ?? "")[TOKEN_COOKIE];

    if (!token) {
      reject(socket, 401, "Unauthorized");
      return;
    }

    let session: TokenSession;

    try {
      session = verifyTokenPayload(token);
    } catch {
      reject(socket, 401, "Unauthorized");
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, session);
    });
  });

  wss.on(
    "connection",
    (ws: AuthenticatedSocket, _req: IncomingMessage, session: TokenSession) => {
      ws.userId = session.userId;
      console.log(`Usuário ${ws.userId} conectado`);

      const expireTimer = setTimeout(
        () => ws.close(4001, "Sessão expirada"),
        session.expiresAt - Date.now(),
      );

      ws.on("close", () => {
        clearTimeout(expireTimer);
        console.log(`Usuário ${ws.userId} desconectou`);
      });
      ws.on("error", (err) => console.error(err));
    },
  );

  return wss;
};
