import { getEmailTemplateByType } from "../../utils/getEmailTemplateByType";
import { EmailType } from "../../utils/enums";
import { createEmail } from "./createEmail";
import { CustomError } from "../../utils/custumError";
import { FAILED_TO_SEND_EMAIL } from "../../utils/messages";

export const sendEmail = async (
  userEmail: string,
  placeholders: Record<string, string> = {},
  type: EmailType
): Promise<void> => {
  try {
    const emailTemplate = getEmailTemplateByType(type);
    await createEmail(userEmail, emailTemplate, type, placeholders);
  } catch (error) {
    throw new CustomError(FAILED_TO_SEND_EMAIL);
  }
};
