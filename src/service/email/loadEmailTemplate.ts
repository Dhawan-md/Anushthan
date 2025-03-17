import fs from "fs/promises";
import path from "path";

import { CustomError } from "../../utils/custumError";
import { FAILED_LOADING_TEMPLATE } from "../../utils/messages";

export const loadEmailTemplate = async (
  templateName: string,
  placeholders: { [key: string]: string }
): Promise<string> => {
  try {
    // path to the template file.
    const templatePath = path.join(__dirname, "templates", templateName);

    let templateContent = await fs.readFile(templatePath, "utf-8");

    // replace placeholders dynamically
    for (const [key, value] of Object.entries(placeholders)) {
      const placeholder = `{${key}}`;
      templateContent = templateContent.replace(
        new RegExp(placeholder, "g"),
        value
      );
    }

    return templateContent;
  } catch (error) {
    throw new CustomError(FAILED_LOADING_TEMPLATE);
  }
};
