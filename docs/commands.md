# Commands

Commands are the write side of the core.

The core behaves like a stateful black box: callers do not mutate its state directly. They send explicit commands with parameters, and the application layer validates and applies those commands.

Commands should be the only way to modify core state.

## Purpose

Commands provide a clear mutation boundary between callers and core state.

They help keep behavior consistent because every state change follows the same explicit path.

## Examples

Initial commands may include:

- Create note
- Update note title
- Update note content
- Update note tags
- Set note property
- Remove note property
- Add attachment
- Remove attachment
- Create saved query
- Update saved query
- Delete saved query

Each command should describe intent, not storage mechanics.

## Command Results

A command should return enough information for callers to continue the workflow.

Useful command results may include:

- Success or failure
- Validation errors
- Created or updated entity IDs
- Application changes produced by the command

Commands should not expose storage-specific implementation details.
