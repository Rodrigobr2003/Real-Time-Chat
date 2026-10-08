import { api } from "./client";
import type { IUserDTO, IPublicUser, IUpdateUserDTO } from "../model/userModel";

const USER_DEFAULT_PATH = "/users";
const PUBLIC_USER_DEFAULT_PATH = `${USER_DEFAULT_PATH}/public`;
const PRIVATE_USER_DEFAULT_PATH = `${USER_DEFAULT_PATH}/private`;

export const createUser = async (userDTO: IUserDTO) => {
  const { data } = await api.post<IPublicUser>(
    PUBLIC_USER_DEFAULT_PATH,
    userDTO,
  );

  return data;
};

const toUpdatePayload = (updateDTO: IUpdateUserDTO) => {
  if (!(updateDTO.userPhoto instanceof File)) return updateDTO;

  const formData = new FormData();

  for (const [key, value] of Object.entries(updateDTO)) {
    if (value === undefined || value === null) continue;
    formData.append(key, value);
  }

  return formData;
};

export const updateUser = async (updateDTO: IUpdateUserDTO) => {
  const { data } = await api.patch<IPublicUser>(
    `${PRIVATE_USER_DEFAULT_PATH}/update`,
    toUpdatePayload(updateDTO),
  );

  return data;
};
