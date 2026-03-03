import sgMail from "@sendgrid/mail";
import { env } from "./env";

// set the API key
sgMail.setApiKey(env.SENDGRID_API_KEY || "");

export default sgMail;
