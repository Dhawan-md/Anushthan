import { DataSource } from "typeorm";
import { env } from "./env";

import { User } from "../entities/User";
import { Pandit } from "../entities/Pandit";
import { Booking } from "../entities/Booking";
import { Otp } from "../entities/Otp";
import { Admin } from "../entities/Admin";
import { Service } from "../entities/Service";
import { Refund } from "../entities/Refund";
import { Transaction } from "../entities/Transaction";
import { Category } from "../entities/Category";
import { CancelledBooking } from "../entities/CancelledBooking";
import { UserLocation } from "../entities/UserLocation";
import { TimeSlot } from "../entities/TimeSlot";
import { Notification } from "../entities/Notification";

import { logger } from "../utils/logger";
import { CustomError } from "../utils/customError";
import { Cart } from "../entities/Cart";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT ?? "5432", 10),
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
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
    UserLocation,
    TimeSlot,
    Cart,
    Notification,
  ],
  synchronize: env.NODE_ENV !== "production",
});

export const intializeDatabase = async () => {
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
