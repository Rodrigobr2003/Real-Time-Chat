import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

const FIFTEEN_MINUTES_IN_SECONDS = 15 * 60;
const parsed = Number(process.env.JWT_EXPIRES_IN);

export const EXPIRES_IN_SECONDS =
  Number.isFinite(parsed) && parsed > 0 ? parsed : FIFTEEN_MINUTES_IN_SECONDS;

export const TOKEN_MAX_AGE_MS = EXPIRES_IN_SECONDS * 1000;

export const signToken = (userId: string) => {
  return jwt.sign({}, SECRET, {
    subject: userId,
    expiresIn: EXPIRES_IN_SECONDS,
  });
};

export interface TokenSession {
  userId: string;
  expiresAt: number;
}

export const verifyTokenPayload = (token: string): TokenSession => {
  const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;

  return { userId: payload.sub as string, expiresAt: payload.exp! * 1000 };
};

export const TOKEN_COOKIE = "access_token";

export const tokenCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;
