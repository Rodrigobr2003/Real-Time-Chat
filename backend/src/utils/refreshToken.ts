import { randomBytes, createHash } from "node:crypto";
import { tokenCookieOptions } from "./jwt";

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
const parsed = Number(process.env.REFRESH_TOKEN_EXPIRES_IN);

export const REFRESH_EXPIRES_IN_SECONDS =
  Number.isFinite(parsed) && parsed > 0 ? parsed : SEVEN_DAYS_IN_SECONDS;

export const REFRESH_TOKEN_MAX_AGE_MS = REFRESH_EXPIRES_IN_SECONDS * 1000;

export const generateRefreshToken = () => randomBytes(64).toString("hex");

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const REFRESH_COOKIE = "refresh_token";

export const refreshCookieOptions = {
  ...tokenCookieOptions,
  path: "/api/auth",
} as const;
