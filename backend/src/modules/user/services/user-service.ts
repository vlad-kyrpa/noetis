import { and, eq, inArray, ne, or } from 'drizzle-orm';
import { users } from '../../../database/schema';
import type { Database } from '../../Database';
import { hashPassword } from '../../auth/services/password-utils';
import type { CreateUserInput, User, UsersService } from '../types';

/** Removes credential material before a user record crosses the module boundary. */
const toUser = (record: typeof users.$inferSelect): User => {
  const { passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...user } = record;
  return user;
};

/** Builds the documented User service on top of the D1 database abstraction. */
export const userServiceFactory = (database: Database): UsersService => ({
  create: async (input: CreateUserInput) => {
    const now = new Date();
    const password = await hashPassword(input.password);
    const rows = await database
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        username: input.username,
        email: input.email,
        passwordHash: password.hash,
        passwordSalt: password.salt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    const record = rows[0];
    return record === undefined ? null : toUser(record);
  },

  update: async ({ id, input }) => {
    const password = await hashPassword(input.password);
    const conflictingUser = await database
      .select({ id: users.id })
      .from(users)
      .where(
        and(ne(users.id, id), or(eq(users.username, input.username), eq(users.email, input.email))),
      )
      .get();
    if (conflictingUser !== undefined) {
      return 'conflict';
    }

    const rows = await database
      .update(users)
      .set({
        username: input.username,
        email: input.email,
        passwordHash: password.hash,
        passwordSalt: password.salt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    const record = rows[0];
    return record === undefined ? 'not-found' : toUser(record);
  },

  remove: async (ids) => {
    await database.delete(users).where(inArray(users.id, ids));
  },

  getById: async (id) => {
    const record = await database.select().from(users).where(eq(users.id, id)).get();
    return record === undefined ? null : toUser(record);
  },

  findCredentials: async (identifier) => {
    const record = await database
      .select()
      .from(users)
      .where(or(eq(users.username, identifier), eq(users.email, identifier)))
      .get();
    return record ?? null;
  },
});
