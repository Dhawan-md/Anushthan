export const INTERNAL_ERROR_OCCURRED = "Internal error occurred.";

// Env messages
export const MISSING_ENV_VARIABLES =
  "Required env variables are missing. Please check the env file.";
export const MISSING_BUCKET_NAME =
  "Bucket name is missing. Please check the env file.";

// Token messages
export const FAILED_TO_GENERATE_TOKEN =
  "Error occurred during token generation.";
export const INVALID_TOKEN = "Unauthorized: Invalid token or expired token.";
export const VALID_TOKEN = "Authorized: Valid token.";
export const NOT_AUTHENTICATED = "Not authenticated.";

// Password messages
export const MIN_PASSWORD_LENGTH =
  "Password must be at least 8 characters long.";
export const ONE_SPECIAL_CHAR =
  "Password must contain at least one special character.";
export const ONE_UPPER_CASE =
  "Password must contain at least one uppercase letter.";
export const ONE_LOWER_CASE =
  "Password must contain at least one lowercase letter.";
export const ONE_NUMERICAL_DIGIT =
  "Password must contain at least one numerical digit.";
export const INVALID_PASSWORD = "Invalid password.";
export const OLD_PASSWORD_ERROR =
  "New password cannot be the same as the old password.";
export const RESET_PASSWORD_SUCCESS = "Password reset successfully.";

// User messages
export const USER_REGISTERED = "User registered.";
export const USER_FOUND = "User found.";
export const USER_LIST = "Users list.";
export const NO_USER_FOUND = "No user with this ID or email found.";
export const USER_EMAIL_ALREADY_EXISTS = "User with this email already exists.";
export const ERROR_FETCHING_USER_DATA =
  "Error occurred while fetching user data.";
export const USER_UPDATED = "User has been updated.";
export const USER_ALREADY_VERIFIED = "User is already verified.";
export const USER_VERIFIED_SUCCESS = "User verified successfully.";
export const LOGIN_SUCCESSFUL = "Login successful.";
export const LOGIN_REQUESTED = "Login requested.";
export const PHONE_NUMBER_REQUIRED =
  "Phone Number Required! Phone number field cannot be empty.";

// OTP messages
export const VALID_OTP = "OTP is valid.";
export const INVALID_OTP = "OTP is invalid.";
export const EXPIRED_OTP = "OTP session has expired.";
export const OTP_SENT = "OTP sent.";
export const NO_OTP_FOUND = "Failed to find OTP details.";
export const INVALID_OTP_TYPE = "Invalid OTP type provided.";
export const RESEND_OTP_SUCCESS = "OTP sent again.";
export const OTP_GENERATION_FAILED = "Failed to generate OTP.";
export const SESSION_EXPIRED = "Session has expired.";
export const OTP_VERIFICATION_REQUIRED =
  "You need to verify OTP before changing your password.";

// Email messages
export const EMAIL_SENT = "Email sent successfully.";
export const FAILED_TO_SEND_EMAIL = "Failed to send email.";
export const FAILED_TO_CREATE_EMAIL = "Failed to create email.";
export const EMAIL_ERROR_OCCURRED =
  "Internal error occurred while sending email.";
export const FAILED_LOADING_TEMPLATE = "Failed to load email template.";
export const NO_TEMPLATE_FOUND = "No template found for this email type.";
export const INVALID_EMAIL = "Invalid email! Please check the email.";

// S3 messages
export const S3_INITIALIZATION_FAILED =
  "S3 client initialization failed. Please check AWS credentials.";
export const INVALID_BUCKET = "Invalid bucket! Bucket does not exist.";
export const SIGNED_URL_GENERATION_FAILED = "Failed to generate signed URL.";

// File upload messages
export const FILE_UPLOAD_FAIL = "File upload failed due to request timeout.";
export const DOCUMENTS_NOT_FOUND = "No document found.";
export const DOCUMENT_ALREADY_SUBMITTED =
  "Documents have already been submitted. Please wait for further response.";
export const FILENAME_MISSING = "File upload failed: filename is missing.";

// Admin messages
export const ADMIN_NOT_FOUND = "Admin not found.";
export const ADMIN_ALREADY_EXISTS = "Admin already exists.";
export const SUPERADMIN_ONLY = "Only super admin can perform this action.";
export const ADMIN_REGISTER_SUCCESS = "Admin registered successfully.";
export const ADMIN_LOGIN_SUCCESS = "Admin logged in successfully.";

// Service messages
export const SERVICE_ADDED_SUCCESS = "New service added successfully.";
