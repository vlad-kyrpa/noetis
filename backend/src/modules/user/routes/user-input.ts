import { z } from 'zod';
import type { CreateUserInput } from '../types';

/** Defines the client-safe user model accepted by write endpoints. */
export const userInputSchema: z.ZodType<CreateUserInput> = z.object({
  username: z.string().trim().min(1),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});
