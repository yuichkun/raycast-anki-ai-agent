import * as v from "valibot";
import { DeckConfiguration } from "./storage";

const DeckConfigurationSchema = v.object({
  deckId: v.number(),
  deckName: v.pipe(v.string(), v.trim(), v.minLength(1)),
  purpose: v.pipe(v.string(), v.trim(), v.minLength(1)),
  noteType: v.picklist(["Basic", "Basic (and reversed card)"]),
  frontTemplate: v.pipe(v.string(), v.trim(), v.minLength(1)),
  backTemplate: v.pipe(v.string(), v.trim(), v.minLength(1)),
  frontExample: v.pipe(v.string(), v.trim(), v.minLength(1)),
  backExample: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

const ImportSchema = v.pipe(v.array(DeckConfigurationSchema), v.minLength(1));

export type ValidationResult = { success: true; data: DeckConfiguration[] } | { success: false; error: string };

export function validateAndParseConfigurations(text: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { success: false, error: "Invalid JSON format" };
  }

  const result = v.safeParse(ImportSchema, parsed);

  if (!result.success) {
    const issue = result.issues[0];
    const path = issue.path?.map((p) => p.key).join(".") || "";
    const error = path ? `${path}: ${issue.message}` : issue.message;
    return { success: false, error };
  }

  return { success: true, data: result.output };
}
