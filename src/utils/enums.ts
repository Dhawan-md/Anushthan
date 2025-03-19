import { registerEnumType } from "type-graphql";

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  PANDIT = "PANDIT",
}

export enum OtpType {
  USER = "USER",
  FORGET_PASSWORD = "FORGET_PASSWORD",
}

export enum OtpStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

registerEnumType(OtpStatus, {
  name: "OtpStatus", // ✅ GraphQL name
  description: "Status of the OTP",
});

registerEnumType(OtpType, {
  name: "OtpType",
  description: "Type of OTP (User/Admin)",
});

export enum EmailType {
  ACCOUNT_VERIFICATION = "Please verify your account.",
  ACCOUNT_VERIFIED = "Account has been verified.",
  FORGET_PASSWORD = "Forget password reset token.",
  PANDIT_REJECTED = "Documents submitted for pandit verification has been rejected",
  PANDIT_APPROVED = "Cogratulations! documents submitted for pandit verification has been approved",
  PANDIT_SUSPENDED = "Due to some suspicious activities pandit has been suspended.",
  PANDIT_PENDING = "Documents has been submitted. You will receive a response shortly.",
}

export enum EmailTemplate {
  ACCOUNT_VERIFICATION = "accountVerification.html",
  ACCOUNT_VERIFIED = "accountVerified.html",
  FORGET_PASSWORD = "forgetPassword.html",
  PANDIT_REJECTED = "panditRejected.html",
  PANDIT_APPROVED = "panditApproved.html",
  PANDIT_SUSPENDED = "panditSuspended.html",
  PANDIT_PENDING = "panditPending.html",
}

export enum s3BucketType {
  IMAGE = "image",
  DOCUMENT = "document",
}
