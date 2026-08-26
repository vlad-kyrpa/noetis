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
      "create-note": this.createNote,
      "update-note": this.updateNote,
      "remove-note": this.removeNote,
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
    command: Extract<Command, { id: "create-note" }>,
  ): Promise<CommandResult<"create-note">> =>
    this.storage.addRecord(command.payload);

  // Updates a note through storage using a named parameter object.
  private updateNote = async (
    command: Extract<Command, { id: "update-note" }>,
  ): Promise<CommandResult<"update-note">> =>
    this.storage.updateRecord({
      id: command.payload.id,
      payload: command.payload,
    });

  // Removes a note through storage and keeps the command boundary uniform.
  private removeNote = async (
    command: Extract<Command, { id: "remove-note" }>,
  ): Promise<CommandResult<"remove-note">> =>
    this.storage.removeRecord(command.payload.id);
}
