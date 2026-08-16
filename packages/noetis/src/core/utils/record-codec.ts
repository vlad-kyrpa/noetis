import type { CoreError, Result, StoredRecord } from "../types";
import { createValidationError } from "./error-factory";
import {
  parseStoredTags,
  TAG_LINE_PREFIX,
  TAG_PREFIX,
  validateTags,
} from "./tag-utils";

const MARKDOWN_EXTENSION = ".md";
export const CONTENT_SEPARATOR = "\n---\n";

const CREATED_AT_LINE_PREFIX = "createdAt: ";
const UPDATED_AT_LINE_PREFIX = "updatedAt: ";
const EXPECTED_STORED_FILE_SECTION_COUNT = 5;

const RECORD_FIELD_KEYS = [
  "title",
  "content",
  "tags",
  "createdAt",
  "updatedAt",
] as const;

type RecordFieldKey = (typeof RECORD_FIELD_KEYS)[number];

export type StoredFileTemplate = {
  name: string;
  content: string;
};

type RecordFieldParser = (record: StoredRecord) => string;

type RecordFieldValidator = (record: StoredRecord) => Result<void, CoreError>;

type ParsedStoredFields = {
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
};

type StoredFieldParser<Key extends RecordFieldKey> = (
  value: string,
) => Result<ParsedStoredFields[Key], CoreError>;

const recordFieldParsers: Record<RecordFieldKey, RecordFieldParser> = {
  title: (record) => record.title.trim(),
  content: (record) => record.content,
  tags: (record) =>
    `${TAG_LINE_PREFIX}${record.tags
      .map((tag) => `${TAG_PREFIX}${tag}`)
      .join(" ")}`,
  createdAt: (record) =>
    `${CREATED_AT_LINE_PREFIX}${record.createdAt.toISOString()}`,
  updatedAt: (record) =>
    record.updatedAt === undefined
      ? UPDATED_AT_LINE_PREFIX.trimEnd()
      : `${UPDATED_AT_LINE_PREFIX}${record.updatedAt.toISOString()}`,
};

const recordFieldValidators: Record<RecordFieldKey, RecordFieldValidator> = {
  title: (record) =>
    validateStoredTextField({
      fieldName: "title",
      value: record.title,
      allowEmpty: false,
    }),
  content: (record) =>
    validateStoredTextField({
      fieldName: "content",
      value: record.content,
      allowEmpty: true,
    }),
  tags: (record) => validateTags(record.tags),
  createdAt: (record) =>
    validateDateField({
      fieldName: "createdAt",
      value: record.createdAt,
      required: true,
    }),
  updatedAt: (record) =>
    validateDateField({
      fieldName: "updatedAt",
      value: record.updatedAt,
      required: false,
    }),
};

const storedFieldParsers: {
  readonly [Key in RecordFieldKey]: StoredFieldParser<Key>;
} = {
  title: (value) =>
    validateStoredTextField({
      fieldName: "title",
      value,
      allowEmpty: false,
    }).ok
      ? { ok: true, value: value.trim() }
      : createValidationError("Stored title is invalid."),
  content: (value) =>
    validateStoredTextField({
      fieldName: "content",
      value,
      allowEmpty: true,
    }).ok
      ? { ok: true, value }
      : createValidationError("Stored content is invalid."),
  tags: (value) => parseStoredTags(value),
  createdAt: (value) =>
    parseRequiredStoredDate({
      fieldName: "createdAt",
      linePrefix: CREATED_AT_LINE_PREFIX,
      value,
    }),
  updatedAt: (value) =>
    parseOptionalStoredDate({
      fieldName: "updatedAt",
      linePrefix: UPDATED_AT_LINE_PREFIX,
      value,
    }),
};

// Converts a record into the markdown file shape after validating each stored field.
export function serializeRecord(
  record: StoredRecord,
): Result<StoredFileTemplate, CoreError> {
  const recordValidation = validateRecord(record);

  if (!recordValidation.ok) {
    return recordValidation;
  }

  const serialized: StoredFileTemplate = {
    name: `${record.id}${MARKDOWN_EXTENSION}`,
    content: RECORD_FIELD_KEYS.map((key) =>
      recordFieldParsers[key](record),
    ).join(CONTENT_SEPARATOR),
  };

  const structureValidation = validateStoredFileStructure(serialized.content);

  if (!structureValidation.ok) {
    return structureValidation;
  }

  return { ok: true, value: serialized };
}

// Parses a stored file.
export function parseStoredRecord(params: {
  id: string;
  content: string;
}): Result<StoredRecord, CoreError> {
  const structureValidation = validateStoredFileStructure(params.content);
  if (!structureValidation.ok) {
    return structureValidation;
  }

  const sections = params.content.split(CONTENT_SEPARATOR);
  const title = storedFieldParsers.title(sections[0] ?? "");
  const content = storedFieldParsers.content(sections[1] ?? "");
  const tags = storedFieldParsers.tags(sections[2] ?? "");
  const createdAt = storedFieldParsers.createdAt(sections[3] ?? "");
  const updatedAt = storedFieldParsers.updatedAt(sections[4] ?? "");

  if (!title.ok || !content.ok || !tags.ok || !createdAt.ok || !updatedAt.ok) {
    return createValidationError("Stored record content is invalid.");
  }

  return {
    ok: true,
    value: {
      id: params.id,
      title: title.value,
      content: content.value,
      tags: tags.value,
      attachments: [],
      createdAt: createdAt.value,
      ...(updatedAt.value === undefined ? {} : { updatedAt: updatedAt.value }),
    },
  };
}

// Runs field-level validation through the same key order used for serialization.
function validateRecord(record: StoredRecord): Result<void, CoreError> {
  const results = RECORD_FIELD_KEYS.map((key) =>
    recordFieldValidators[key](record),
  );
  const failure = results.find((result) => !result.ok);
  return failure ?? { ok: true, value: undefined };
}

// Validates the stored section count and metadata line positions.
function validateStoredFileStructure(content: string): Result<void, CoreError> {
  const sections = content.split(CONTENT_SEPARATOR);
  const hasExpectedSectionCount =
    sections.length === EXPECTED_STORED_FILE_SECTION_COUNT;
  const hasExpectedMetadataLines =
    (sections[2] ?? "").startsWith(TAG_LINE_PREFIX) &&
    (sections[3] ?? "").startsWith(CREATED_AT_LINE_PREFIX) &&
    (sections[4] ?? "").startsWith(UPDATED_AT_LINE_PREFIX.trimEnd());

  if (!hasExpectedSectionCount || !hasExpectedMetadataLines) {
    return createValidationError("Stored record file structure is invalid.");
  }

  return { ok: true, value: undefined };
}

// Checks text fields that would break the section-based markdown format.
function validateStoredTextField(params: {
  fieldName: string;
  value: string;
  allowEmpty: boolean;
}): Result<void, CoreError> {
  const normalizedValue = params.value.trim();
  const isEmptyWhenRequired =
    !params.allowEmpty && normalizedValue.length === 0;
  const hasSeparator = params.value.includes(CONTENT_SEPARATOR);

  if (isEmptyWhenRequired) {
    return createValidationError(`${params.fieldName} cannot be empty.`);
  }

  if (hasSeparator) {
    return createValidationError(
      `${params.fieldName} cannot include the content separator "---".`,
    );
  }

  return { ok: true, value: undefined };
}

// Ensures stored date fields are real dates before they reach the file format.
function validateDateField(params: {
  fieldName: string;
  value: Date | undefined;
  required: boolean;
}): Result<void, CoreError> {
  const isMissingRequiredDate = params.required && params.value === undefined;
  const isInvalidDate =
    params.value !== undefined && Number.isNaN(params.value.getTime());

  if (isMissingRequiredDate || isInvalidDate) {
    return createValidationError(`${params.fieldName} must be a valid date.`);
  }

  return { ok: true, value: undefined };
}

// Parses a required stored ISO date line.
function parseRequiredStoredDate(params: {
  fieldName: string;
  linePrefix: string;
  value: string;
}): Result<Date, CoreError> {
  const parsedDate = parseOptionalStoredDate(params);

  if (!parsedDate.ok) {
    return parsedDate;
  }

  if (parsedDate.value === undefined) {
    return createValidationError(`${params.fieldName} must be a valid date.`);
  }

  return { ok: true, value: parsedDate.value };
}

// Parses an optional stored ISO date line.
function parseOptionalStoredDate(params: {
  fieldName: string;
  linePrefix: string;
  value: string;
}): Result<Date | undefined, CoreError> {
  const hasExpectedPrefix = params.value.startsWith(
    params.linePrefix.trimEnd(),
  );
  const dateText = hasExpectedPrefix
    ? params.value.slice(params.linePrefix.length).trim()
    : "";
  const date = dateText.length === 0 ? undefined : new Date(dateText);
  const validation = validateDateField({
    fieldName: params.fieldName,
    value: date,
    required: false,
  });

  if (!hasExpectedPrefix) {
    return createValidationError(`${params.fieldName} line is invalid.`);
  }

  if (!validation.ok) {
    return validation;
  }

  return { ok: true, value: date };
}
