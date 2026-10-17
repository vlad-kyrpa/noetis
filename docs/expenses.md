# Expenses module architecture

ExpenseRecord:

- id - Stable identifier for the expense record.
- amount - Signed monetary value: positive for income and negative for an expense.
- tag - Optional category reference used for grouping and reporting.
- description - Optional explanation of the transaction.
- createdAt - Timestamp recorded when the record is created.
- updatedAt - Timestamp refreshed whenever the record changes.

Operations

- create - Add an expense or income record with its initial metadata.
- update - Revise a record while preserving its identity.
- remove(ids[]) - Delete one or more records by identifier.
- find(filters) - Return records that satisfy the supplied filters.
  - filters
    - dateRange - Include records created within a specified date range.
    - tag - Include records associated with a specific tag.
