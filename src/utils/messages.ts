export const INTERNAL_ERROR_OCCURRED = "Internal error occurred.";
export const NO_DATA_TO_UPDATE = "No data to update";

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
export const UNAUTHORIZED = "Unauthorized: User ID, not found in context";

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
export const USER_ALREADY_EXISTS = "User with this email already exists.";
export const ERROR_FETCHING_USER_DATA =
  "Error occurred while fetching user data.";
export const USER_UPDATED = "User has been updated.";
export const USER_ALREADY_VERIFIED = "User is already verified.";
export const USER_VERIFIED_SUCCESS = "User verified successfully.";
export const LOGIN_SUCCESSFUL = "Login successful.";
export const LOGIN_REQUESTED = "Login requested. Otp has been sent.";
export const PHONE_NUMBER_REQUIRED =
  "Phone Number Required! Phone number field cannot be empty.";
export const USER_ONLY = "Only Users can perform this action.";

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
export const BOOKING_OTP_SENT = "OTP sent. Please verify to start booking.";

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
export const FETCH_DOCUMENT_SUCCESS = "Document fetched successfully";

// Admin messages
export const ADMIN_NOT_FOUND = "Admin not found.";
export const ADMIN_ALREADY_EXISTS = "Admin already exists.";
export const SUPERADMIN_ONLY = "Only super admin can perform this action.";
export const ADMIN_REGISTER_SUCCESS = "Admin registered successfully.";
export const ADMIN_LOGIN_SUCCESS = "Admin logged in successfully.";

// Service messages
export const SERVICE_ADDED_SUCCESS = "New service added successfully.";
export const SERVICE_IDS_FOUND = "Service Ids found successfully.";
export const SERVICE_NOT_FOUND = "Invalid or missing services.";
export const SERVICE_ALREADY_EXISTS = "Service already exists.";
export const NO_SERVICE_ID_PROVIDED = "No service id provided";
export const SERVICE_LIST = "Services list.";
export const SERVICE_DOES_NOT_BELONG_TO_THIS_CATEGORY =
  "One or more selected services do not belong to the specified category.";

// Pandit messages
export const PANDIT_REGISTERED = "Pandit registered successfully.";
export const PANDIT_LOGIN_REQUESTED = "Pandit login requested. Otp sent.";
export const PANDIT_ALREADY_EXISTS = "Pandit already exists.";
export const PANDIT_LIST = "Pandits list.";
export const NO_PANDIT_FOUND = "No pandit with this ID or email found.";
export const STATUS_UPDATED = "Document status has been updated";
export const PANDIT_UPDATED = "Pandit has been updated.";
export const PANDIT_ONLY = "Only Pandit can perform this action.";

// Category messages
export const CATEGORY_ADDED_SUCCESS = "New category added successfully.";
export const CATEGORY_ALREADY_EXISTS = "Category already exists.";
export const CATEGORY_LIST = "Categories list.";
export const CATEGORY_NOT_FOUND = "Category not found.";
export const NO_CATEGORY_ID_PROVIDED = "No category id provided";
export const CATEGORY_IDS_FOUND = "Category Ids found successfully.";

//Booking Messages
export const BOOKING_UPDATED = "Booking edited successfully.";
export const BOOKING_LIST = "Bookings list.";
export const BOOKING_PLACED = "Booking placed successfully.";
export const BOOKING_ACCEPTED = "Booking accepted.";
export const BOOKING_CANCELLED_USER = "Booking has been cancelled by user.";
export const BOOKING_CANCELLED_PANDIT = "Booking has been cancelled by pandit.";

//Transaction Message
export const NO_TRANSACTION_FOUND = "No transaction found.";

//Refund Message
export const NO_REFUND_FOUND = "No refund found.";
export const REFUND_UPDATED = "Refund updated successfully.";

//Location Message
export const FETCH_LOCATION_ERROR = "Unable to fetch location";
export const LOCATION_NOT_FOUND = "Location not found";
