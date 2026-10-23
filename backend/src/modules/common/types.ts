import { Database } from "../Database";

/** Represents an endpoint request part that intentionally carries no fields. */
export type EmptyObject = Record<never, never>;

/** Groups the IDs that must be added, retained, or removed during a collection update. */
export interface CollectionDiff<T> {
  readonly added: readonly T[];
  readonly retained: readonly T[];
  readonly removed: readonly T[];
}

export interface RouteHandlerDependencies {
  readonly databaseFactory: (binding: D1Database) => Database;
}
