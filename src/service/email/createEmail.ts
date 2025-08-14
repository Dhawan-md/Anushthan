// import sgMail from "../../config/sendGrid";
import { EmailType } from "../../utils/enums";
import { CustomError } from "../../utils/customError";
import { loadEmailTemplate } from "./loadEmailTemplate";
import { logger } from "../../utils/logger";
import { FAILED_TO_CREATE_EMAIL } from "../../utils/messages";

export const createEmail = async (
  to: string,
  templateName: string,
  subject: EmailType,
  placeholders: Record<string, string> = {}
): Promise<void> => {
  try {
    const htmlContent = await loadEmailTemplate(templateName, placeholders);

    const msg = {
      to,
      from: "mohit2728dhawan45@gmail.com",
      subject,
      html: htmlContent,
    };

    // await sgMail.send(msg);
    logger.info(`Email sent to ${to} successfully.${msg}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
    throw new CustomError(FAILED_TO_CREATE_EMAIL);
  }
};
