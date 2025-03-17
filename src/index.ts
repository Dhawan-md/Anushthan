import express, { Application } from "express";
import cors from "cors";
import {
  // GraphQLUpload,
  graphqlUploadExpress,
  // Upload,
} from "graphql-upload-minimal";
import { intializeDatabase } from "./config/database";
// import { buildSchema } from "type-graphql";
// import Container from "typedi";

const createApp = async () => {
  const app: Application = express();
  app.use(cors());
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 2 }));

  // const schema = await buildSchema({
  //   container: Container,
  // })

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
