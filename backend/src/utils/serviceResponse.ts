import {
  USER_BACKGROUND_COLOR,
  USER_PHOTO_MIME_TYPE,
} from "@models/userSchema";
import { PublicUser, UserDoc } from "@typings/user";

const toPhotoDataURL = (photo: UserDoc["userPhoto"]) =>
  photo
    ? `data:${USER_PHOTO_MIME_TYPE};base64,${photo.toString("base64")}`
    : null;

export const toPublicUser = (doc: UserDoc): PublicUser => ({
  id: doc._id.toString(),
  accountId: doc.accountId,
  name: doc.name,
  user: doc.user,
  email: doc.email,
  description: doc.description ?? "",
  userPhotoURL: toPhotoDataURL(doc.userPhoto),
  status: doc.status ?? "online",
  profileBgColor: doc.profileBgColor ?? USER_BACKGROUND_COLOR[0],
  createdAt: doc.createdAt,
});
