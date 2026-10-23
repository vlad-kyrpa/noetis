import type { BodyDecoder } from "../../common/routes/validation";
import { isJsonObject } from "../../common/utils/json";
import type { ExpenseInput } from "../types";

/** Decodes a complete expense write model before it reaches the service. */
export const decodeExpenseInput: BodyDecoder<ExpenseInput> = (value) => {
  if (
    !isJsonObject(value) ||
    typeof value.amount !== "number" ||
    !Number.isFinite(value.amount)
  )
    return null;
  const optional = (field: unknown): string | null | undefined =>
    field === null
      ? null
      : field === undefined
        ? undefined
        : typeof field === "string"
          ? field
          : undefined;
  const description = optional(value.description);
  const tagId = optional(value.tagId);
  return description === undefined || tagId === undefined
    ? null
    : { amount: value.amount, description, tagId };
};
