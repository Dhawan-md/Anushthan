import dotenv from "dotenv";
import { DataSource } from "typeorm";

import { User } from "../entities/User";
import { Pandit } from "../entities/Pandit";
import { Booking } from "../entities/Booking";
import { Otp } from "../entities/Otp";
import { Admin } from "../entities/Admin";

import { Service } from "../entities/Service";
import { logger } from "../utils/logger";

import { CustomError } from "../utils/customError";
import { MISSING_ENV_VARIABLES } from "../utils/messages";
import { Category } from "../entities/Category";
import { CancelledBooking } from "../entities/CancelledBooking";
import { Transaction } from "../entities/Transaction";
import { Refund } from "../entities/Refund";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env["DB_HOST"],
  port: parseInt(process.env["DB_PORT"] ?? "5432", 10),
  username: process.env["DB_USER"],
  password: process.env["DB_PASSWORD"],
  database: process.env["DB_NAME"],
  entities: [
    User,
    Pandit,
    Otp,
    Admin,
    Service,
    Booking,
    Category,
    CancelledBooking,
    Transaction,
    Refund,
  ],
  synchronize: process.env["NODE_ENV"] !== "production",
});

export const intializeDatabase = async () => {
  if (
    !process.env["DB_HOST"] ||
    !process.env["DB_USER"] ||
    !process.env["DB_PASSWORD"] ||
    !process.env["DB_NAME"] ||
    !process.env["NODE_ENV"]
  ) {
    throw new CustomError(MISSING_ENV_VARIABLES);
  }

  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      logger.info("✅ Database connected successfully!");
    } catch (error) {
      logger.error("🔥 Database connection failed:", error);
      throw new CustomError("Database connection failed!");
    }
  }
};
