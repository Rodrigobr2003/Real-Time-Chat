import { useCallback, useMemo, useState, type ReactNode } from "react";
import { UserContext, type IUserContext } from "./userContextInstance";
import type { IUserDTO } from "../model/userModel";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../api/userHelpers";
import { logout } from "../api/auth";

interface IUserProvider {
  children: ReactNode;
}

const INITIAL_USER: IUserDTO = {
  name: "",
  email: "",
  user: "",
  password: "",
};

export const UserProvider = ({ children }: IUserProvider) => {
  const queryClient = useQueryClient();
  const [userDTO, setUserDTO] = useState<IUserDTO>(INITIAL_USER);

  const applyDTOChanges = useCallback(
    (field: string, value: string) => {
      setUserDTO((data) => {
        return { ...data, [field]: value };
      });
    },
    [setUserDTO],
  );

  const clearDTOFields = useCallback(() => {
    setUserDTO(INITIAL_USER);
  }, []);

  const {
    mutate: createUserMutation,
    isPending: isCreationPending,
    isError: creationError,
  } = useMutation({
    mutationFn: createUser,
    onSuccess: () => clearDTOFields(),
  });

  const { mutate: logoutMutation, isPending: isLogoutPending } = useMutation({
    mutationFn: logout,
    // Limpa o cache do React Query para não sobrar dado do usuário anterior.
    onSuccess: () => queryClient.clear(),
  });

  const value = useMemo<IUserContext>(
    () => ({
      userDTO,
      applyDTOChanges,
      clearDTOFields,
      createUserMutation,
      isCreationPending,
      creationError,
      logoutMutation,
      isLogoutPending,
    }),
    [
      userDTO,
      applyDTOChanges,
      clearDTOFields,
      createUserMutation,
      isCreationPending,
      creationError,
      logoutMutation,
      isLogoutPending,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
