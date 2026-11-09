import { z } from 'zod';
import { normalizeTagLabels } from './normalize-tag-label';

/** Validates a body tag list and stores it lower-cased and deduped, for every tagged record. */
export const tagLabelsSchema = z
  .array(z.string().trim().min(1))
  .default([])
  .transform((labels): readonly string[] => normalizeTagLabels(labels));
