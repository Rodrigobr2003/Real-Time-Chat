import e from "express";
import auth from "./public/auth";
import users from "./public/user";
import privateAuth from "./private/auth";
import privateUser from "./private/user";
import privateChat from "./private/chat";

const appRoutes = (app: e.Application, prefix: string = "") => {
  auth(app, prefix);
  users(app, prefix);
  privateAuth(app, prefix);
  privateUser(app, prefix);
  privateChat(app, prefix);
};

export default appRoutes;
