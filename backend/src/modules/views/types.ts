/** Limits a saved view to one record collection. */
export type ViewType = 'note' | 'expense' | 'task';
/** Represents a saved, public view definition. */
export interface View {
  readonly id: string;
  readonly userId: string;
  readonly type: ViewType;
  readonly title: string;
  readonly tags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
/** Defines the write model for a saved view. */
export interface ViewInput {
  readonly type: ViewType;
  readonly title: string;
  readonly tags: readonly string[];
}
/** Defines supported filters for listing views. */
export interface ViewFilters {
  readonly type?: ViewType;
}
/** Defines storage-agnostic saved-view behavior. */
export interface ViewsService {
  create(input: ViewInput): Promise<Result<View>>;
  find(filters: ViewFilters): Promise<readonly View[]>;
  get(id: string): Promise<View | null>;
  update(params: { readonly id: string; readonly input: ViewInput }): Promise<Result<View>>;
  remove(ids: readonly string[]): Promise<void>;
}
import type { Result } from '../common/utils/result';
