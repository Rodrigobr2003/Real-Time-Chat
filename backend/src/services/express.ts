import cors from "cors";
import express from "express";
import appRoutes from "@routes/routes";

const createServer = (): express.Application => {
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(cors({ origin: process.env.CLIENT_URL }));

  appRoutes(app, "/api/");

  return app;
};

export { createServer };
