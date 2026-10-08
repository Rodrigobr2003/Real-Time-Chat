import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../api/userHelpers";
import { useAuth } from "../hooks/useAuth";
import {
  PROFILE_BG_COLORS,
  USER_STATUS,
  type IPublicUser,
  type IUpdateUserDTO,
  type IUserProfileFields,
} from "../model/userModel";
import { ME_QUERY_KEY } from "./authContextInstance";
import {
  UserUpdateContext,
  type IUserUpdateContext,
} from "./userUpdateContextInstance";

interface IUserUpdateProvider {
  children: ReactNode;
}

const toProfileFields = (user: IPublicUser | null): IUserProfileFields => ({
  name: user?.name ?? "",
  user: user?.user ?? "",
  email: user?.email ?? "",
  description: user?.description ?? "",
  status: user?.status ?? USER_STATUS[0],
  profileBgColor: user?.profileBgColor ?? PROFILE_BG_COLORS[0],
  userPhoto: user?.userPhotoURL ?? null,
});

export const UserUpdateProvider = ({ children }: IUserUpdateProvider) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Guarda só o que foi editado; o resto vem sempre do usuário logado.
  const [edits, setEdits] = useState<Partial<IUserProfileFields>>({});

  const currentFields = useMemo(() => toProfileFields(user), [user]);

  const updateDTO = useMemo<IUserProfileFields>(
    () => ({ ...currentFields, ...edits }),
    [currentFields, edits],
  );

  const changedFields = useMemo(() => {
    const changed: IUpdateUserDTO = {};

    for (const key of Object.keys(edits) as (keyof IUserProfileFields)[]) {
      if (edits[key] !== currentFields[key]) {
        Object.assign(changed, { [key]: edits[key] });
      }
    }

    return changed;
  }, [edits, currentFields]);

  const hasChanges = Object.keys(changedFields).length > 0;

  const applyUpdateChanges = useCallback(
    <K extends keyof IUserProfileFields>(
      field: K,
      value: IUserProfileFields[K],
    ) => {
      setEdits((data) => ({ ...data, [field]: value }));
    },
    [],
  );

  const resetUpdateDTO = useCallback(() => {
    setEdits({});
  }, []);

  const {
    mutate: updateUserMutation,
    isPending: isUpdatePending,
    isError: updateError,
  } = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(ME_QUERY_KEY, updatedUser);
      resetUpdateDTO();
    },
  });

  const value = useMemo<IUserUpdateContext>(
    () => ({
      updateDTO,
      changedFields,
      hasChanges,
      applyUpdateChanges,
      resetUpdateDTO,
      updateUserMutation,
      isUpdatePending,
      updateError,
    }),
    [
      updateDTO,
      changedFields,
      hasChanges,
      applyUpdateChanges,
      resetUpdateDTO,
      updateUserMutation,
      isUpdatePending,
      updateError,
    ],
  );

  return (
    <UserUpdateContext.Provider value={value}>
      {children}
    </UserUpdateContext.Provider>
  );
};
