import { registerEnumType } from "type-graphql";

export enum UserRole {
  USER = "USER",
  PANDIT = "PANDIT",
}

export enum OtpType {
  USER = "USER",
  PANDIT = "PANDIT",
  FORGET_PASSWORD = "FORGET PASSWORD"
}

export enum OtpStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum PanditStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
}

registerEnumType(UserRole, {
  name: "UserRole",
  description: "Different roles of users in the system",
});

registerEnumType(OtpStatus, {
  name: "OtpStatus", // ✅ GraphQL name
  description: "Status of the OTP",
});

registerEnumType(OtpType, {
  name: "OtpType",
  description: "Type of OTP (User/Admin)",
});

registerEnumType(PanditStatus, {
  name: "PanditStatus",
  description: "Status of pandit approval",
});

export enum EmailType {
  ACCOUNT_VERIFICATION = "Please verify your account.",
  ACCOUNT_VERIFIED = "Account has been verified.",
  FORGET_PASSWORD = "Forget password reset token.",
  PANDIT_REJECTED = "Documents submitted for pandit verification has been rejected",
  PANDIT_APPROVED = "Congratulations! documents submitted for pandit verification has been approved",
  PANDIT_SUSPENDED = "Due to some suspicious activities pandit has been suspended.",
  PANDIT_PENDING = "Documents has been submitted. You will receive a response shortly.",
  PANDIT_LOGGIN = "Please use this otp to log into your account."
}

export enum EmailTemplate {
  ACCOUNT_VERIFICATION = "accountVerification.html",
  ACCOUNT_VERIFIED = "accountVerified.html",
  FORGET_PASSWORD = "forgetPassword.html",
  PANDIT_REJECTED = "panditRejected.html",
  PANDIT_APPROVED = "panditApproved.html",
  PANDIT_SUSPENDED = "panditSuspended.html",
  PANDIT_PENDING = "panditPending.html",
  PANDIT_LOGGIN = "panditLoggin.html",
}

export enum S3BucketType {
  IMAGE = "image",
  DOCUMENT = "document",
}

export enum AdminRole {
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
  USER = "USER",
}

export enum EmailName {
  USER = "User",
  PANDIT = "Pandit ji",
}
