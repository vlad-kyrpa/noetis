/** Represents a signed income or expense record. */
export interface ExpenseRecord {
  readonly id: string;
  readonly amount: number;
  readonly tag: string | null;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Defines the write model required to create or replace a financial record. */
export interface ExpenseInput {
  readonly amount: number;
  readonly description: string | null;
  readonly tag: string | null;
}

/** Defines the documented Expenses query filters. */
export interface ExpenseFilters {
  readonly tag?: string;
  readonly from?: Date;
  readonly to?: Date;
}

/** Defines the storage-agnostic behavior exposed by the Expenses module. */
export interface ExpensesService {
  create(input: ExpenseInput): Promise<ExpenseRecord>;
  update(params: {
    readonly id: string;
    readonly input: ExpenseInput;
  }): Promise<ExpenseRecord | null>;
  remove(ids: readonly string[]): Promise<void>;
  find(filters: ExpenseFilters): Promise<readonly ExpenseRecord[]>;
}
