import { api } from "./client";
import type { IPublicUser } from "../model/userModel";

const PUBLIC_AUTH_DEFAULT_PATH = "/auth/public";
const PRIVATE_AUTH_DEFAULT_PATH = "/auth/private";

export interface ILoginDTO {
  userOrEmail: string;
  password: string;
}

export const manualLogin = async (loginDTO: ILoginDTO) => {
  const { data } = await api.post<IPublicUser>(
    `${PUBLIC_AUTH_DEFAULT_PATH}/login`,
    loginDTO,
  );

  return data;
};

export const getMe = async () => {
  const { data } = await api.get<IPublicUser>(
    `${PRIVATE_AUTH_DEFAULT_PATH}/me`,
  );

  return data;
};

export const refreshSession = async () => {
  await api.post(`${PUBLIC_AUTH_DEFAULT_PATH}/refresh`);
};

export const logout = async () => {
  await api.post(`${PRIVATE_AUTH_DEFAULT_PATH}/logout`);
};
