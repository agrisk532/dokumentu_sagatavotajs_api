import { findTemplate } from "./templates.js";

const LIMITS = {
  vards: 80,
  uzvards: 80,
  iestade: 160,
  saturs: 8000,
};

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function readDocumentRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Nederīgs pieprasījums.");
  }

  const templateId = typeof body.templateId === "string" ? body.templateId : "";
  const template = findTemplate(templateId);
  if (!template) {
    throw httpError(400, "Nezināma dokumenta veidne.");
  }

  const input = { templateId };
  for (const key of Object.keys(LIMITS)) {
    const value = body[key];
    if (value == null || value === "") {
      input[key] = "";
      continue;
    }
    if (typeof value !== "string") {
      throw httpError(400, "Lauka vērtībai jābūt tekstam.");
    }
    if (value.length > LIMITS[key]) {
      throw httpError(400, "Viens no laukiem ir pārāk garš.");
    }
    input[key] = value;
  }

  const datums = body.datums ?? "";
  if (typeof datums !== "string" || (datums !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(datums))) {
    throw httpError(400, "Datums jānorāda formātā GGGG-MM-DD.");
  }
  input.datums = datums;

  return { template, input };
}
