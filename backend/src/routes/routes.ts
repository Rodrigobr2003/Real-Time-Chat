import e from "express";
import auth from "./public/auth";

const appRoutes = (app: e.Application, prefix: string = "") => {
  auth(app, prefix);
};

export default appRoutes;
