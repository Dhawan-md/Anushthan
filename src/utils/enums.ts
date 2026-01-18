import { registerEnumType } from "type-graphql";

export enum UserRole {
  USER = "USER",
  PANDIT = "PANDIT",
}
registerEnumType(UserRole, {
  name: "UserRole",
  description: "Different roles of users in the system",
});

export enum OtpType {
  USER = "USER",
  PANDIT = "PANDIT",
  FORGET_PASSWORD = "FORGET PASSWORD",
}
registerEnumType(OtpType, {
  name: "OtpType",
  description: "Type of OTP (User/Admin)",
});

export enum ActiveStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
registerEnumType(ActiveStatus, {
  name: "activeStatus", // ✅ GraphQL name
  description: "Status of the entry",
});

export enum PanditStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
}
registerEnumType(PanditStatus, {
  name: "PanditStatus",
  description: "Status of pandit approval",
});

export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  STARTED = "STARTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
registerEnumType(BookingStatus, { name: "BookingStatus" });

export enum PaymentMethod {
  UPI = "UPI",
  CARD = "CARD",
  WALLET = "WALLET",
  NET_BANKING = "NET_BANKING",
}
registerEnumType(PaymentMethod, {
  name: "PaymentMethod", // this name will show up in GraphQL schema
  description: "Available payment methods",
});

export enum EmailType {
  ACCOUNT_VERIFICATION = "Please verify your account.",
  ACCOUNT_VERIFIED = "Account has been verified.",
  FORGET_PASSWORD = "Forget password reset token.",
  PANDIT_REJECTED = "Documents submitted for pandit verification has been rejected",
  PANDIT_APPROVED = "Congratulations! documents submitted for pandit verification has been approved",
  PANDIT_SUSPENDED = "Due to some suspicious activities pandit has been suspended.",
  PANDIT_PENDING = "Documents has been submitted. You will receive a response shortly.",
  PANDIT_LOGIN = "Please use this otp to log into your account.",
}

export enum EmailTemplate {
  ACCOUNT_VERIFICATION = "accountVerification.html",
  ACCOUNT_VERIFIED = "accountVerified.html",
  FORGET_PASSWORD = "forgetPassword.html",
  PANDIT_REJECTED = "panditRejected.html",
  PANDIT_APPROVED = "panditApproved.html",
  PANDIT_SUSPENDED = "panditSuspended.html",
  PANDIT_PENDING = "panditPending.html",
  PANDIT_LOGIN = "panditLoggin.html",
}

export enum S3BucketType {
  IMAGE = "image",
  PANDIT_DOCUMENTS = "document",
}

export enum AdminRole {
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

export enum EmailName {
  USER = "User",
  PANDIT = "Pandit ji",
}

export enum UserCancellationReason {
  USER_CHANGED_MIND = "User changed their mind",
  PANDIT_UNAVAILABLE = "Could not find a Pandit was unavailable",
  LOCATION_ISSUE = "Issue with the location",
  DUPLICATE_BOOKING = "Duplicate booking made",
  OTHER = "Other reason",
}
registerEnumType(UserCancellationReason, {
  name: "UserCancellationReason", // this name will appear in the GraphQL schema
  description: "Reason provided by user for cancelling a booking",
});

export enum PanditCancellationReason {
  USER_UNRESPONSIVE = "User was unresponsive",
  PERSONAL_EMERGENCY = "Personal emergency or issue",
  DOUBLE_BOOKED = "Pandit was double booked",
  LOCATION_TOO_FAR = "Location is too far or inaccessible",
  OTHER = "Other reason",
}

registerEnumType(PanditCancellationReason, {
  name: "PanditCancellationReason", // this name will appear in the GraphQL schema
  description: "Reason provided by Pandit for cancelling a booking",
});

export enum TransactionType {
  PAYMENT_INCOMING = "PAYMENT_INCOMING",
  PAYMENT_OUTGOING = "PAYMENT_OUTGOING",
  PENALTY = "PENALTY",
}
registerEnumType(TransactionType, { name: "TransactionType" });

export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}
registerEnumType(TransactionStatus, { name: "TransactionStatus" });

export enum RefundStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}
registerEnumType(RefundStatus, { name: "RefundStatus" });

export enum RefundReason {
  CANCELLATION = "CANCELLATION",
  SERVICE_ISSUE = "SERVICE_ISSUE",
  DUPLICATE_PAYMENT = "DUPLICATE_PAYMENT",
  OTHER = "OTHER",
}

export enum PaymentType {
  COD = "COD",
  ONLINE = "ONLINE",
}
registerEnumType(PaymentType, { name: "PaymentType" });

export enum PanditLedgerType {
  EARNING = "EARNING", // + amount
  PENALTY = "PENALTY", // - amount
  PAYOUT = "PAYOUT", // - amount (money you paid to pandit)
  ADJUSTMENT = "ADJUSTMENT", // +/- amount
}
registerEnumType(PanditLedgerType, { name: "PanditLedgerType" });

export enum PanditLedgerStatus {
  POSTED = "POSTED", // applied to wallet
  VOID = "VOID", // reversed/invalids
}
registerEnumType(PanditLedgerStatus, { name: "PanditLedgerStatus" });
