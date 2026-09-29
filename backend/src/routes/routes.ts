import e from "express";
import auth from "./private/auth";

const appRoutes = (app: e.Application, prefix: string = "") => {
  auth(app, prefix);
};

export default appRoutes;
