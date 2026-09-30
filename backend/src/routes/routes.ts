import e from "express";
import auth from "./public/auth";
import users from "./public/user";

const appRoutes = (app: e.Application, prefix: string = "") => {
  auth(app, prefix);
  users(app, prefix);
};

export default appRoutes;
