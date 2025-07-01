import { createBullQueue } from "../../config/bullmq";

export const paymentTimeoutQueue = createBullQueue("paymentTimeout");
