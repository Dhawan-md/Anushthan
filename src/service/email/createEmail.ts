import sgMail from "../../config/sendGrid";
import { EmailType } from "../../utils/enums";
import { CustomError } from "../../utils/custumError";
import { loadEmailTemplate } from "./loadEmailTemplate";

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

    await sgMail.send(msg);
    console.log(`Email sent to ${to} successfully.`);
  } catch (error) {
    throw new CustomError(error);
  }
};
