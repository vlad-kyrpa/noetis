# Development Rules

These rules keep the codebase predictable, testable, and easy to move across platforms.

## Types

- Use strict TypeScript.
- Do not use `any`.
- Do not guess types when creating constants.
- Define explicit return types for functions and class methods.
- Prefer inferred types for local implementation details when the assignment makes the type obvious.
- Do not annotate callback parameters or return values inside `map`, `filter`, `find`, `flatMap`, or similar collection methods unless inference fails or a type predicate is required.
- Keep shared module types in a `types.ts` file at the module root.
- Prefer narrow domain types over loose primitives when the value has meaning.
- No concrete class/function should depend on other concrete class object -> use interfaces.

## Function Style

- ONLY and ABSOLUTELY pure functions no exceptions.
- Pass dependencies and required objects as parameters.
- Avoid hidden module state.
- Avoid `let` and `var`; ONLY `const`.
- Use functional collection methods such as `map`, `flatMap`, `filter`, and `forEach` instead of manual loops when they stay readable.
- Avoid mutation unless the mutation is isolated inside the application core or a storage adapter.

## Parameters

- If a function has more than one parameter, create a named parameters interface.

## Control Flow

- Prefer maps/records over long `if` or `switch` chains when selecting behavior by key.
- Keep nesting shallow.
- If logic goes deeper than one or two levels, extract a helper or split the flow.
- Long if() conditions are descructured and extracted
- Do not over-extract linear code that is already easy to read.

## Constants

- Extract constants instead of using magic numbers or repeated strings.
- Name constants after domain meaning, not just value shape.
- Keep constants close to the module that owns them unless they are shared domain concepts.

## Architecture Boundaries

- Keep the core pure and storage-agnostic.
- Keep React code out of the core and application layer.
- Keep filesystem paths and binary index details inside the storage layer.
- Route state changes through commands.
- Route reads through queries.
- Route change notifications through callbacks.

## Modules

- Use ES modules.
- Write relative imports without `.ts` or `.js` extensions.
- Example: `import { createNote } from "./create-note"`.

## Classes and State

- Keep OOP limited.
- The core may be a class if it is the central stateful abstraction.
- Initialize stateful objects at the project root.
- Prefer functions and plain data for most module logic.

## Errors

- Return typed failures for expected domain errors.
- Use Result pattern.
- Throw only for unexpected or unrecoverable failures.
- Validation errors should be explicit enough for the UI to show useful feedback.

## Tests

- Every `.ts` file should have a sibling `.test.ts` file.
- Test public behavior, not implementation details.
- Keep pure function tests small and direct.
- Keep test harness and utils and reuse in other tests.

## Comments

- EVERY function, method, class, and functional unit should have a short intent comment.
- Comments should explain why the code exists, not restate what the code already says.
- Include parameter details only when they clarify non-obvious behavior.
