import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { CustomError } from "../utils/custumError";
import { MISSING_ENV_VARIABLES } from "../utils/messages";
import { Pandit } from "../entities/Pandit";
import { Otp } from "../entities/Otp";

dotenv.config();

if (
  !process.env["DB_HOST"] ||
  !process.env["DB_USER"] ||
  !process.env["DB_PASSWORD"] ||
  !process.env["DB_NAME"]
) {
  throw new CustomError(MISSING_ENV_VARIABLES);
}

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env["DB_HOST"],
  port: parseInt(process.env["DB_PORT"] || "5432", 10),
  username: process.env["DB_USER"],
  password: process.env["DB_PASSWORD"],
  database: process.env["DB_NAME"],
  entities: [User, Pandit, Otp],
  synchronize: true,
});

export const intializeDatabase = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("Database connected!");
  }
};
