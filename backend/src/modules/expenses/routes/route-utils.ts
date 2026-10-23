import type { Context } from 'hono';
import { decodeIds, isJsonObject } from '../../common/utils/json';
import type { ExpenseFilters } from '../types';

/** Decodes the identifier list accepted by the Expenses remove command. */
export const decodeIdsCommand = (value: unknown): { readonly ids: readonly string[] } | null => {
  if (!isJsonObject(value)) return null;
  const ids = decodeIds(value.ids);
  return ids === null ? null : { ids };
};
/** Converts ISO query parameters into a date-range filter or rejects invalid dates. */
export const expenseFilters = (context: Context): ExpenseFilters | null => {
  const from = context.req.query('from');
  const to = context.req.query('to');
  const fromDate = from === undefined ? undefined : new Date(from);
  const toDate = to === undefined ? undefined : new Date(to);
  const invalid =
    (fromDate !== undefined && Number.isNaN(fromDate.getTime())) ||
    (toDate !== undefined && Number.isNaN(toDate.getTime()));
  return invalid ? null : { tagId: context.req.query('tag'), from: fromDate, to: toDate };
};
/** Reads a validated body without globally coupling Hono context variables. */
export const bodyOf = <T>(context: Context): T =>
  (context.get as unknown as (key: string) => T)('body');
/** Reads a path identifier after route validation middleware has run. */
export const idOf = (context: Context): string => context.req.param('id') ?? '';
