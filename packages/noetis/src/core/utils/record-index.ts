import type { Query, StoredRecord } from "../types";
import { normalizeTags } from "./tag-utils";

export type StoredRecordIndexItem = {
  id: string;
  tags: string[];
  title: string;
};

// Converts stored index JSON into the supported index item shape.
export function parseRecordIndex(content: string): StoredRecordIndexItem[] {
  try {
    const value: unknown = JSON.parse(content);

    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(isStoredRecordIndexItem).map((item) => ({
      id: item.id,
      title: item.title.trim(),
      tags: normalizeTags(item.tags),
    }));
  } catch (_error: unknown) {
    return [];
  }
}

// Creates the index representation for a stored record.
export function createRecordIndexItem(
  record: StoredRecord,
): StoredRecordIndexItem {
  return {
    id: record.id,
    title: record.title,
    tags: record.tags,
  };
}

// Converts a record file path into the id stored in its filename.
export function getRecordIdFromRecordPath(params: {
  path: string;
  extension: string;
}): string {
  const normalizedPath = params.path.replace(/\\/g, "/");
  const fileName = normalizedPath.split("/").at(-1) ?? normalizedPath;

  return fileName.slice(0, -params.extension.length);
}

// Adds or replaces one record entry in the index.
export function upsertRecordIndexItem(params: {
  indexItems: StoredRecordIndexItem[];
  record: StoredRecord;
}): StoredRecordIndexItem[] {
  const nextItem = createRecordIndexItem(params.record);
  const existingItems = params.indexItems.filter(
    (item) => item.id !== params.record.id,
  );

  return [...existingItems, nextItem];
}

// Removes one record entry from the index.
export function removeRecordIndexItem(params: {
  indexItems: StoredRecordIndexItem[];
  id: string;
}): StoredRecordIndexItem[] {
  return params.indexItems.filter((item) => item.id !== params.id);
}

// Performs cheap tag filtering before full record reads.
export function matchesIndexQuery(
  item: StoredRecordIndexItem,
  query: Query,
): boolean {
  return (
    query.tags.length === 0 ||
    query.tags.every((tag) => item.tags.includes(tag))
  );
}

// Checks the raw JSON value before trusting it as a record index item.
function isStoredRecordIndexItem(
  value: unknown,
): value is StoredRecordIndexItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    Array.isArray(item.tags) &&
    item.tags.every((tag) => typeof tag === "string")
  );
}
