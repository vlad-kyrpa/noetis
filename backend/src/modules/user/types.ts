/** Represents user data that can safely be returned by the User API. */
export interface User {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Represents credential material that is only available to authentication code. */
export interface UserCredentials extends User {
  readonly passwordHash: string;
  readonly passwordSalt: string;
}

/** Defines the plaintext registration model accepted from a client. */
export interface CreateUserInput {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

/** Defines the plaintext model used to replace a user. */
export type UpdateUserInput = CreateUserInput;

/** Identifies expected outcomes that prevent replacing a user record. */
export type UpdateUserResult = User | 'not-found' | 'conflict';

/** Defines the storage-agnostic behavior exposed by the User module. */
export interface UsersService {
  create(input: CreateUserInput): Promise<User | null>;
  update(params: {
    readonly id: string;
    readonly input: UpdateUserInput;
  }): Promise<UpdateUserResult>;
  remove(ids: readonly string[]): Promise<void>;
  getById(id: string): Promise<User | null>;
  findCredentials(identifier: string): Promise<UserCredentials | null>;
}
