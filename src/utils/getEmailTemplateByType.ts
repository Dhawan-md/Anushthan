import { EmailTemplate, EmailType } from "./enums";
import { CustomError } from "./custumError";
import { NO_TEMPLATE_FOUND } from "./messages";

export const getEmailTemplateByType = (emailType: EmailType): EmailTemplate => {
  switch (emailType) {
    case EmailType.ACCOUNT_VERIFICATION:
      return EmailTemplate.ACCOUNT_VERIFICATION;
    case EmailType.ACCOUNT_VERIFIED:
      return EmailTemplate.ACCOUNT_VERIFIED;
    case EmailType.FORGET_PASSWORD:
      return EmailTemplate.FORGET_PASSWORD;
    case EmailType.PANDIT_REJECTED:
      return EmailTemplate.PANDIT_REJECTED;
    case EmailType.PANDIT_APPROVED:
      return EmailTemplate.PANDIT_APPROVED;
    case EmailType.PANDIT_SUSPENDED:
      return EmailTemplate.PANDIT_SUSPENDED;
    case EmailType.PANDIT_PENDING:
      return EmailTemplate.PANDIT_PENDING;
    default:
      throw new CustomError(NO_TEMPLATE_FOUND);
  }
};
