import express, { Application } from "express";
import Container from "typedi";
import { buildSchema } from "type-graphql";
import cors from "cors";
import {
  // GraphQLUpload,
  graphqlUploadExpress,
  // Upload,
} from "graphql-upload-minimal";
import { ApolloServer } from "apollo-server-express";

import { intializeDatabase } from "./config/database";
import { UserMutationResolver } from "./resolvers/User/UserMutationResolver";
import { loggerMiddlware } from "./middlewares/loggerMiddleware";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { logger } from "./utils/logger";
import { UserQueryresolver } from "./resolvers/User/UserQueryResolver";

const createApp = async () => {
  const app: Application = express();
  app.use(cors());
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 2 }));

  const schema = await buildSchema({
    resolvers: [UserMutationResolver, UserQueryresolver],
    container: Container,
    globalMiddlewares: [loggerMiddlware, globalErrorHandler],
  });

  const server = new ApolloServer({
    schema,
    logger,
  });
  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  return app;
};

const startServer = async () => {
  await intializeDatabase();
  const app = await createApp();
  app.listen(5000, () => {
    console.log("Server is running at http://localhost:5000/graphql");
  });
};

startServer();
