import type { NextFunction, Request, Response } from "express";
import { TOKEN_COOKIE, verifyTokenPayload } from "@utils/jwt";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.[TOKEN_COOKIE];

  if (!token) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    req.userId = verifyTokenPayload(token).userId;
    next();
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada" });
  }
};
