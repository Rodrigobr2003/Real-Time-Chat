import { PublicUser, UserDoc } from "@typings/user";

export const toPublicUser = (doc: UserDoc): PublicUser => ({
  id: doc._id.toString(),
  accountId: doc.accountId,
  name: doc.name,
  user: doc.user,
  email: doc.email,
  createdAt: doc.createdAt,
});
