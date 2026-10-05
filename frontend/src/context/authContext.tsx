import { useEffect, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logout, manualLogin } from "../api/auth";
import type { IPublicUser } from "../model/userModel";
import { AuthContext, type IAuthContext } from "./authContextInstance";

interface IAuthProvider {
  children: ReactNode;
}

const ME_QUERY_KEY = ["me"] as const;

export const AuthProvider = ({ children }: IAuthProvider) => {
  const queryClient = useQueryClient();

  const { data: user = null, isPending: isCheckingSession } =
    useQuery<IPublicUser | null>({
      queryKey: ME_QUERY_KEY,
      queryFn: getMe,
      retry: false,
      staleTime: Infinity,
    });

  const setUser = (value: IPublicUser | null) =>
    queryClient.setQueryData(ME_QUERY_KEY, value);

  useEffect(() => {
    const handleExpired = () => queryClient.setQueryData(ME_QUERY_KEY, null);

    window.addEventListener("auth:session-expired", handleExpired);

    return () =>
      window.removeEventListener("auth:session-expired", handleExpired);
  }, [queryClient]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [queryClient]);

  const { mutate: loginMutation, isPending: isLoginPending } = useMutation({
    mutationFn: manualLogin,
    onSuccess: (loggedUser) => setUser(loggedUser),
  });

  const { mutate: logoutMutation, isPending: isLogoutPending } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== ME_QUERY_KEY[0],
      });
    },
  });

  const value = useMemo<IAuthContext>(
    () => ({
      user,
      isCheckingSession,
      loginMutation,
      isLoginPending,
      logoutMutation,
      isLogoutPending,
    }),
    [
      user,
      isCheckingSession,
      loginMutation,
      isLoginPending,
      logoutMutation,
      isLogoutPending,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
