import { z } from 'zod';
import { normalizeTagLabel } from '../normalize-tag-label';
import type { TagInput } from '../types';

/** Represents the payload accepted when a tag is created. */
export type CreateTagInput = TagInput;

/** Defines the tag write model accepted by Tags endpoints; labels are stored lower-cased. */
export const tagInputSchema: z.ZodType<TagInput> = z.object({
  label: z.string().trim().min(1).transform(normalizeTagLabel),
});
