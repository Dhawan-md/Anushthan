declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;

    // Database
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    DB_PORT?: string;

    // JWT
    JWT_SECRET: string;
    JWT_EXPIRY?: string;

    // AWS
    AWS_ACCESS_KEY: string;
    AWS_SECRET_KEY: string;
    AWS_REGION: string;
    AWS_BUCKET_NAME: string;

    // Sendgrid
    SENDGRID_API_KEY: string;

    //razorpayApiKeys
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;

    // google api
    GOOGLE_API_CREDENTIALS: string;

    // Server
    PORT?: string;
  }
}
