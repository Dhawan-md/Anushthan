import "reflect-metadata";

import express, { Application } from "express";
import cors from "cors";
import { createServer, Server } from "http";
// import { Server as ioServer } from "socket.io";

import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import {
  GraphQLUpload,
  graphqlUploadExpress,
  Upload,
} from "graphql-upload-minimal";
import Container from "typedi";

import { NotificationProvider } from "./providers/notification/notificationProvider";

import { UploadScalar } from "./types/scalar/UploadScalar";

import { context } from "./auth/context";
import { authChecker } from "./auth/authChecker";

import { intializeDatabase } from "./config/database";
import { redisPublisher, redisSubscriber } from "./config/redis";
// import { setSocketServerInstance } from "./config/socket";

import { loggerMiddlware } from "./middlewares/loggerMiddleware";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

import { razorpayWebhookHandler } from "./service/payment/razorpayWebhookHandler";

import { logger } from "./utils/logger";

import { OtpMutationResolver } from "./resolvers/otp/OtpMutationResolver";
import { AdminMutationResolver } from "./resolvers/admin/AdminMutationResolver";
import { PanditMutationResolver } from "./resolvers/pandit/PanditMutationResolver";
import { AminQueryResolver } from "./resolvers/admin/AdminQueryResolver";
import { BookingMutationResolver } from "./resolvers/booking/BookingMutationResolver";
import { ServiceQueryResolver } from "./resolvers/services/ServiceQueryResolver";
import { CategoryQueryResolver } from "./resolvers/category/CategoryQueryResolver";
import { UserMutationResolver } from "./resolvers/user/UserMutationResolver";
import { UserQueryResolver } from "./resolvers/user/UserQueryResolver";
import { CartMutationResolver } from "./resolvers/cart/CartMutationResolver";
import { BookingQueryResolver } from "./resolvers/booking/BookingQueryResolver";

const createApp = async () => {
  const app: Application = express();
  app.use(cors());
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 4 }));

  const schema = await buildSchema({
    resolvers: [
      UserMutationResolver,
      OtpMutationResolver,
      AdminMutationResolver,
      PanditMutationResolver,
      AminQueryResolver,
      BookingMutationResolver,
      BookingQueryResolver,
      ServiceQueryResolver,
      CategoryQueryResolver,
      UserQueryResolver,
      CartMutationResolver,
    ],
    authChecker: authChecker,
    container: Container,
    globalMiddlewares: [loggerMiddlware, globalErrorHandler],
    scalarsMap: [{ type: Upload, scalar: UploadScalar }],
    emitSchemaFile: {
      path: "./schema.gql",
      sortedSchema: false,
    },
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

  Container.set("redisPublisher", redisPublisher);
  Container.set("redisSubscriber", redisSubscriber);

  const notificationProvider = Container.get(NotificationProvider);

  await notificationProvider.subscribe("booking_notification");

  app.get("/test-payment/:orderId", (req, res) => {
    const { orderId } = req.params;
    const html = `
  <form>
    <script
      src="https://checkout.razorpay.com/v1/checkout.js"
      data-key="${process.env.RAZORPAY_KEY_ID}"
      data-order_id="${orderId}"
      data-amount="50000"
      data-currency="INR"
      data-name="Test App"
      data-description="Test Payment"
      data-prefill.name="Test User"
      data-prefill.email="test@example.com"
      data-prefill.contact="9999999999"
      data-theme.color="#3399cc"
    ></script>
  </form>`;
    res.send(html);
  });

  app.post(
    "/api/razorpay/webhook",
    express.raw({ type: "application/json" }), // Important for signature check
    razorpayWebhookHandler
  );

  return app;
};

const startServer = async () => {
  try {
    await intializeDatabase();
    const app = await createApp();

    const httpServer = createServer(app);

    // Attach socket.io
    // const io = new ioServer(httpServer, {
    //   cors: { origin: "*" },
    // });

    // setSocketServerInstance(io);

    // io.on("connection", (socket) => {
    //   const userId = socket.handshake.query.userId;
    //   if (userId) {
    //     socket.join(`user_${userId}`);
    //     logger.info(
    //       `[index.ts] User ${userId} connected and joined room user_${userId}`
    //     );
    //   } else {
    //     logger.warn(
    //       "[index.ts] A socket connected without a userId in handshake query."
    //     );
    //   }
    // });

    const PORT = process.env.PORT || 5000;

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server is running at http://localhost:${PORT}/graphql`);
    });

    // ✅ Gracefully handle shutdown
    process.on("SIGINT", () => shutdown(httpServer));
    process.on("SIGTERM", () => shutdown(httpServer));
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
