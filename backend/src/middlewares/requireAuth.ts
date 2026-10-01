import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "@utils/jwt";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: "Sessão inválida ou expirada" });
  }
};
