import { getEmailTemplateByType } from "../../utils/getEmailTemplateByType";
import { EmailType } from "../../utils/enums";
import { createEmail } from "./createEmail";

export const sendEmail = async (
  userEmail: string,
  placeholders: Record<string, string> = {},
  type: EmailType
): Promise<void> => {
  const emailTemplate = getEmailTemplateByType(type);
  await createEmail(userEmail, emailTemplate, type, placeholders);
};
