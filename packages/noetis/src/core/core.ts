import type {
  Command,
  CommandResult,
  CoreError,
  CoreStorage,
  NoteId,
  Query,
  Result,
  StoredRecord,
  StoredRecordHeader,
} from "./types";
import { CommandId } from "./types";

export type StateChangeCallback = () => void;

type CommandHandler<Id extends Command["id"]> = (
  command: Extract<Command, { id: Id }>,
) => Promise<CommandResult<Id>>;

type CommandHandlers = {
  [Id in Command["id"]]: CommandHandler<Id>;
};

export interface CoreEngineConfig {
  storage: CoreStorage;
}

// Coordinates command, query, and callback flow while keeping storage details outside the core.
export class CoreEngine {
  private readonly storage: CoreStorage;
  private readonly commandHandlers: CommandHandlers;
  private updateSubscribers: readonly StateChangeCallback[];

  // Stores injected dependencies and binds command ids to storage-agnostic handlers.
  constructor(config: CoreEngineConfig) {
    this.storage = config.storage;
    this.updateSubscribers = [];
    this.commandHandlers = {
      [CommandId.CreateNote]: this.createNote,
      [CommandId.UpdateNote]: this.updateNote,
      [CommandId.RemoveNote]: this.removeNote,
      [CommandId.CreateStoredQuery]: this.createStoredQuery,
      [CommandId.CreateStoredQueryContainer]:
        this.createStoredQueryContainer,
      [CommandId.UpdateStoredQueryContainer]:
        this.updateStoredQueryContainer,
      [CommandId.RemoveStoredQueryContainer]:
        this.removeStoredQueryContainer,
      [CommandId.UpdateStoredQuery]: this.updateStoredQuery,
      [CommandId.RemoveStoredQuery]: this.removeStoredQuery,
    };
  }

  // Routes state changes through command handlers and reports typed failures to callers.
  async run<Id extends Command["id"]>(
    command: Extract<Command, { id: Id }>,
  ): Promise<CommandResult<Id>> {
    const handler = this.commandHandlers[command.id] as CommandHandler<Id>;
    const result = await handler(command);

    if (result.ok) {
      this.notifyStateUpdate();
    }

    return result;
  }

  // Routes list reads through the storage query boundary.
  async query(query: Query): Promise<Result<StoredRecordHeader[], CoreError>> {
    return this.storage.findRecords(query);
  }

  // Routes direct record reads through the storage query boundary.
  async get(ids: NoteId[]): Promise<Result<StoredRecord[], CoreError>> {
    return this.storage.getRecords(ids);
  }

  // Registers a callback that will be called after a successful command.
  addStateUpdateCallback(callback: StateChangeCallback): void {
    this.updateSubscribers = [...this.updateSubscribers, callback];
  }

  // Removes a previously registered state update callback.
  removeStateUpdateCallback(callback: StateChangeCallback): void {
    this.updateSubscribers = this.updateSubscribers.filter(
      (e) => e !== callback,
    );
  }

  // Fan-outs successful command notifications without exposing subscriber storage.
  private notifyStateUpdate(): void {
    this.updateSubscribers.forEach((callback) => callback());
  }

  // Creates a note through storage so persistence stays outside the core engine.
  private createNote = async (
    command: Extract<Command, { id: CommandId.CreateNote }>,
  ): Promise<CommandResult<CommandId.CreateNote>> =>
    this.storage.addRecord(command.payload);

  // Updates a note through storage using a named parameter object.
  private updateNote = async (
    command: Extract<Command, { id: CommandId.UpdateNote }>,
  ): Promise<CommandResult<CommandId.UpdateNote>> =>
    this.storage.updateRecord({
      id: command.payload.id,
      payload: command.payload,
    });

  // Removes a note through storage and keeps the command boundary uniform.
  private removeNote = async (
    command: Extract<Command, { id: CommandId.RemoveNote }>,
  ): Promise<CommandResult<CommandId.RemoveNote>> =>
    this.storage.removeRecord(command.payload.id);

  // Creates a stored query item through storage.
  private createStoredQuery = async (
    command: Extract<Command, { id: CommandId.CreateStoredQuery }>,
  ): Promise<CommandResult<CommandId.CreateStoredQuery>> =>
    this.storage.createStoredQuery(command.payload);

  // Creates a stored query container through storage.
  private createStoredQueryContainer = async (
    command: Extract<Command, { id: CommandId.CreateStoredQueryContainer }>,
  ): Promise<CommandResult<CommandId.CreateStoredQueryContainer>> =>
    this.storage.createStoredQueryContainer(command.payload);

  // Updates a stored query container through storage.
  private updateStoredQueryContainer = async (
    command: Extract<Command, { id: CommandId.UpdateStoredQueryContainer }>,
  ): Promise<CommandResult<CommandId.UpdateStoredQueryContainer>> =>
    this.storage.updateStoredQueryContainer(command.payload);

  // Removes a stored query container through storage.
  private removeStoredQueryContainer = async (
    command: Extract<Command, { id: CommandId.RemoveStoredQueryContainer }>,
  ): Promise<CommandResult<CommandId.RemoveStoredQueryContainer>> =>
    this.storage.removeStoredQueryContainer(command.payload);

  // Updates a stored query item through storage.
  private updateStoredQuery = async (
    command: Extract<Command, { id: CommandId.UpdateStoredQuery }>,
  ): Promise<CommandResult<CommandId.UpdateStoredQuery>> =>
    this.storage.updateStoredQuery(command.payload);

  // Removes a stored query item through storage.
  private removeStoredQuery = async (
    command: Extract<Command, { id: CommandId.RemoveStoredQuery }>,
  ): Promise<CommandResult<CommandId.RemoveStoredQuery>> =>
    this.storage.removeStoredQuery(command.payload);
}
