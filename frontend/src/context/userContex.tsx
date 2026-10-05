import { useCallback, useMemo, useState, type ReactNode } from "react";
import { UserContext, type IUserContext } from "./userContextInstance";
import type { IUserDTO } from "../model/userModel";
import { useMutation } from "@tanstack/react-query";
import { createUser } from "../api/userHelpers";

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

  const value = useMemo<IUserContext>(
    () => ({
      userDTO,
      applyDTOChanges,
      clearDTOFields,
      createUserMutation,
      isCreationPending,
      creationError,
    }),
    [
      userDTO,
      applyDTOChanges,
      clearDTOFields,
      createUserMutation,
      isCreationPending,
      creationError,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
