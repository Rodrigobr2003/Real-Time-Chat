import { isAxiosError } from "axios";
import type { IPunishmentInfo } from "../model/chatModel";

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[] | undefined>;
  punishment?: IPunishmentInfo;
}

export const getPunishment = (error: unknown) =>
  (isAxiosError<ApiErrorBody>(error) && error.response?.data?.punishment) ||
  null;

// Traduz a resposta de erro do backend (400/409/500) para o formulário.
export const getApiErrors = (error: unknown) => {
  if (!isAxiosError<ApiErrorBody>(error) || !error.response) {
    return { message: "Não foi possível conectar ao servidor" };
  }

  const { data } = error.response;
  const fields: Record<string, string> = {};

  for (const [field, messages] of Object.entries(data?.errors ?? {})) {
    if (messages?.[0]) fields[field] = messages[0];
  }

  return {
    message: data?.message ?? "Erro inesperado, tente novamente",
    fields,
  };
};
