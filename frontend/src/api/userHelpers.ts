import { api } from "./client";
import type { IUserDTO, IPublicUser } from "../model/userModel";

const USER_DEFAULT_PATH = "/users";

export const createUser = async (userDTO: IUserDTO) => {
  const { data } = await api.post<IPublicUser>(USER_DEFAULT_PATH, userDTO);

  return data;
};
