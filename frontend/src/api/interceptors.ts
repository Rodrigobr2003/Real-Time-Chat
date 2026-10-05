import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { api } from "./client";
import { refreshSession } from "./auth";

const SKIP_REFRESH = [
  "/auth/public/login",
  "/auth/public/refresh",
  "/auth/private/logout",
];

let refreshPromise: Promise<void> | null = null;

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const setupAuthInterceptor = () => {
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;

      const shouldSkip =
        error.response?.status !== 401 ||
        !original ||
        original._retry ||
        SKIP_REFRESH.some((url) => original.url?.includes(url));

      if (shouldSkip) return Promise.reject(error);

      original._retry = true;

      try {
        refreshPromise ??= refreshSession().finally(() => {
          refreshPromise = null;
        });

        await refreshPromise;
      } catch (refreshError) {
        window.dispatchEvent(new Event("auth:session-expired"));
        return Promise.reject(refreshError);
      }

      return api(original);
    },
  );
};
