import { useContext } from "react";
import { UserUpdateContext } from "../context/userUpdateContextInstance";

export const useUserUpdate = () => {
  const context = useContext(UserUpdateContext);

  if (!context) {
    throw new Error(
      "useUserUpdate deve ser usado dentro de um UserUpdateProvider",
    );
  }

  return context;
};
