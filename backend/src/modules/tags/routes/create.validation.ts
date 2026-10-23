import { z } from "zod";
import type { TagInput } from "../types";

/** Represents the payload accepted when a tag is created. */
export type CreateTagInput = TagInput;

/** Defines the tag write model accepted by Tags endpoints. */
export const tagInputSchema: z.ZodType<TagInput> = z.object({
  label: z.string().trim().min(1),
});
