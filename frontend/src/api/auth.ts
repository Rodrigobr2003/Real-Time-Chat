import { api } from "./client";
import type { IPublicUser } from "../model/userModel";

const AUTH_DEFAULT_PATH = "/auth";

export interface ILoginDTO {
  userOrEmail: string;
  password: string;
}

export const manualLogin = async (loginDTO: ILoginDTO) => {
  const { data } = await api.post<IPublicUser>(
    `${AUTH_DEFAULT_PATH}/login`,
    loginDTO,
  );

  return data;
};
