export const INTERNAL_ERROR_OCCURRED = "Internal error occurred.";

// env messages
export const MISSING_ENV_VARIABLES =
  "Required env variables are missing, please check the env file.";
export const MISSING_BUCKET_NAME =
  "Bucket name is missing, please check the env file.";

// token messages
export const FAILED_TO_GENERATE_TOKEN = "Error occurred in token generation.";

// password messages
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

// User Messages
export const USER_REGISTERED = "User registered.";
export const USER_FOUND = "User Found.";
export const USER_LIST = "Users list.";
export const NO_USER_FOUND = "No user with this ID or email found.";
export const USER_EMAIL_ALREADY_EXISTS = "User with this email already exist.";
export const ERROR_FETCHING_USER_DATA =
  "Error occured while fetching user data.";
export const USER_UPDATED = "User has been updated.";
export const USER_ALREADY_VERIFIED = "User is already verified.";
export const USER_VERIFIED_SUCCESS = "User verified successfully.";

// OTP Messages
export const VALID_OTP = "OTP is valid.";
export const INVALID_OTP = "OTP is invalid.";
export const EXPIRED_OTP = "OTP has expired";
export const OTP_SENT = "OTP sent.";
export const NO_OTP_FOUND = "Failed to find otp details";
export const INVALID_OTP_TYPE = "Invalid Otp type provided";
export const RESEND_OTP_SUCCESS = "OTP sent again.";
export const OTP_GENERATION_FAILED = "Failed to generate OTP.";

// email messages
export const EMAIL_SENT = "Email sent successfully.";
export const FAILED_TO_SEND_EMAIL = "Failed to send email.";
export const EMAIL_ERROR_OCCURED =
  "Internal error occured while sending email.";
export const FAILED_LOADING_TEMPLATE = "Failed to laod email template.";
export const NO_TEMPLATE_FOUND = "No template found for this email type.";

// s3 messages
export const S3_INITIALIZATION_FAILED =
  "S3 client initialization failed. Please check AWS credentials.";
export const INVALID_BUCKET = "Invaid bucket! bucket does not exists.";

// File upload messages
export const FILE_UPLOAD_FAIL = "Request timeout! Failed to upload files.";
export const DOCUMENTS_NOT_FOUND = "No document found.";
export const DOCUMENT_ALREADY_SUBMITTED =
  "Documents already submitted. Please wait for further response.";
export const FILENAME_MISSING = "File upload failed: filename is missing.";
