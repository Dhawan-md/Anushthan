import { Service } from "typedi";
import sgMail from "../../config/sendGrid";
import { env } from "../../config/env";
import { EmailType } from "../../utils/enums";
import { CustomError } from "../../utils/customError";
import { logger } from "../../utils/logger";
import { FAILED_TO_CREATE_EMAIL } from "../../utils/messages";
import { loadEmailTemplate } from "./loadEmailTemplate";
import { getEmailTemplateByType } from "../../utils/getEmailTemplateByType";

@Service()
export class EmailService {
    private fromEmail: string;

    constructor() {
        this.fromEmail = env.FROM_EMAIL || "mohit2728dhawan45@gmail.com";
        if (!env.SENDGRID_API_KEY) {
            logger.warn("[EmailService] ⚠️ SendGrid API key missing. Emails will not be sent.");
        }
    }

    async sendEmail(
        to: string,
        placeholders: Record<string, string> = {},
        type: EmailType
    ): Promise<void> {
        const templateName = getEmailTemplateByType(type);

        try {
            const htmlContent = await loadEmailTemplate(templateName, placeholders);

            const msg = {
                to,
                from: this.fromEmail,
                subject: type,
                html: htmlContent,
            };

            if (env.SENDGRID_API_KEY) {
                await sgMail.send(msg);
                logger.info(`✅ Email sent to ${to} successfully | Type: ${type}`);
            } else {
                logger.info(`📧 [Dry Run] Email would be sent to ${to} | Type: ${type}`);
            }
        } catch (error: any) {
            logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
            throw new CustomError(FAILED_TO_CREATE_EMAIL);
        }
    }
}
