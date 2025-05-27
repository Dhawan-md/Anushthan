import express, { Application } from "express";
import cors from "cors";
import { Server } from "http";

import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import {
  GraphQLUpload,
  graphqlUploadExpress,
  Upload,
} from "graphql-upload-minimal";
import Container from "typedi";

import { UploadScalar } from "./types/scalar/UploadScalar";

import { context } from "./auth/context";
import { authChecker } from "./auth/authChecker";

import { intializeDatabase } from "./config/database";

import { loggerMiddlware } from "./middlewares/loggerMiddleware";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

import { logger } from "./utils/logger";

import { UserMutationResolver } from "./resolvers/user/UserMutationResolver";
import { OtpMutationResolver } from "./resolvers/otp/OtpMutationResolver";
import { AdminMutationResolver } from "./resolvers/admin/AdminMutationResolver";
import { PanditMutationResolver } from "./resolvers/pandit/PanditMutationResolver";
import { AminQueryResolver } from "./resolvers/admin/AdminQueryResolver";

const createApp = async () => {
  const app: Application = express();
  app.use(cors());
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 2 }));

  const schema = await buildSchema({
    resolvers: [
      UserMutationResolver,
      OtpMutationResolver,
      AdminMutationResolver,
      PanditMutationResolver,
      AminQueryResolver
    ],
    authChecker: authChecker,
    container: Container,
    globalMiddlewares: [loggerMiddlware, globalErrorHandler],
    scalarsMap: [{ type: Upload, scalar: UploadScalar }],
  });

  const resolvers = {
    Upload: GraphQLUpload, // Make sure GraphQLUpload is registered
  };

  const server = new ApolloServer({
    schema,
    resolvers,
    logger,
    context,
    introspection: true,
  });
  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  return app;
};

const startServer = async () => {
  try {
    await intializeDatabase();
    const app = await createApp();
    const server = app.listen(5000, () => {
      logger.info("🚀 Server is running at http://localhost:5000/graphql");
    });

    // ✅ Gracefully handle shutdown
    process.on("SIGINT", () => shutdown(server));
    process.on("SIGTERM", () => shutdown(server));
  } catch (error) {
    logger.error("❌ Server failed to start:", error);
    process.exit(1);
  }
};

const shutdown = (server: Server) => {
  logger.info("🛑 Shutting down server...");

  server.close(() => {
    logger.info("✅ Server closed.");
    process.exit(0);
  });
};

startServer();
