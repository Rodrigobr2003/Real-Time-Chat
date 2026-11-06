import { OAuth2Client } from "google-auth-library";
import { UnauthorizedError } from "@errors/UnauthorizedError";

const client = new OAuth2Client();

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
}

export const verifyGoogleCredential = async (
  credential: string,
): Promise<GoogleProfile> => {
  const ticket = await client
    .verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    .catch(() => {
      throw new UnauthorizedError("Token do Google inválido");
    });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    throw new UnauthorizedError("E-mail do Google não verificado");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email.split("@")[0],
    picture: payload.picture ?? null,
  };
};
