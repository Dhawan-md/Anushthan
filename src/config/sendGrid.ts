import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

//set the API key
sgMail.setApiKey(process.env["SENDGRID_API_KEY"] || "");

export default sgMail;
