import fs from "fs/promises";
import path from "path";

export const loadEmailTemplate = async (
  templateName: string,
  placeholders: { [key: string]: string }
): Promise<string> => {
  // path to the template file.
  const templatePath = path.join(__dirname, "templates", templateName);

  let templateContent = await fs.readFile(templatePath, "utf-8");

  // replace placeholders dynamically
  for (const [key, value] of Object.entries(placeholders)) {
    templateContent = templateContent.replaceAll(key, value);
  }

  return templateContent;
};
