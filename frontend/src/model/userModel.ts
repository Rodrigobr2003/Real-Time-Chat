export const USER_STATUS = ["online", "absent", "busy", "invisible"] as const;
export const PROFILE_BG_COLORS = [
  "#6c5ce7",
  "#00b894",
  "#0984e3",
  "#e84393",
  "#e17055",
  "#fdcb6e",
] as const;

export const USER_PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const USER_PHOTO_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export type UserStatus = (typeof USER_STATUS)[number];

export type UserPhoto = string | File | null;

export interface IUserDTO {
  name: string;
  user: string;
  email: string;
  password: string;
}

export interface IUserProfileFields {
  name: string;
  user: string;
  email: string;
  description: string;
  status: UserStatus;
  profileBgColor: string;
  userPhoto: UserPhoto;
}

export type IUpdateUserDTO = Partial<Omit<IUserProfileFields, "userPhoto">> & {
  userPhoto?: File | null;
};

export interface IPublicUser {
  id: string;
  accountId: string;
  name: string;
  user: string;
  email: string;
  description: string;
  userPhotoURL: string | null;
  status: UserStatus;
  profileBgColor: string;
  createdAt: string;
}
