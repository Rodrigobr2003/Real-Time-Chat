import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "@services/express";
import http from "http";
import { AddressInfo } from "net";

dotenv.config();

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || 8800;

async function startServer() {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI não definida no .env");
  }

  await mongoose.connect(MONGO_URI);

  const app = createServer();

  const server = http.createServer(app).listen({ host, port }, () => {
    const addressInfo = server.address() as AddressInfo;

    console.log(
      `Server ready at http://${addressInfo.address}:${addressInfo.port}`,
    );
  });

  return app;
}

export default startServer;
