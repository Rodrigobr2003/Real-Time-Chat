import { useContext } from "react";
import { UserContext } from "../context/userContextInstance";

export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser deve ser usado dentro de um UserProvider");
  }

  return context;
};
