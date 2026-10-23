/** Represents a reusable label returned from the Tags module. */
export interface Tag {
  readonly id: string;
  readonly label: string;
  readonly createdAt: Date;
}

/** Defines the write model required to create a tag. */
export interface TagInput {
  readonly label: string;
}

/** Defines the storage-agnostic behavior exposed by the Tags module. */
export interface TagsService {
  create(input: TagInput): Promise<Tag | null>;
  find(label: string | null): Promise<readonly Tag[]>;
  remove(ids: readonly string[]): Promise<void>;
}
