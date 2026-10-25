/** Defines the output of a password hashing operation. */
export interface PasswordHash {
  readonly hash: string;
  readonly salt: string;
}

/** Sets a work factor that slows offline guessing without making login impractical. */
const PASSWORD_HASH_ITERATIONS = 100_000;

/** Fixes the derived key size used by the stored password representation. */
const PASSWORD_KEY_LENGTH = 256;

/** Converts binary values into a portable base64 representation. */
const toBase64 = (value: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(value)));

/** Converts the stored base64 representation back to its binary form. */
const fromBase64 = (value: string): Uint8Array =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

/** Derives a password key using a supplied salt so verification can recompute it. */
const derivePassword = async (params: {
  readonly password: string;
  readonly salt: Uint8Array;
}): Promise<ArrayBuffer> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(params.password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: params.salt.buffer as ArrayBuffer,
      iterations: PASSWORD_HASH_ITERATIONS,
    },
    key,
    PASSWORD_KEY_LENGTH,
  );
};

/** Hashes a plaintext password for initial account provisioning. */
export const hashPassword = async (password: string): Promise<PasswordHash> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toBase64(salt.buffer), hash: toBase64(await derivePassword({ password, salt })) };
};

/** Compares a plaintext password to its stored PBKDF2 representation. */
export const verifyPassword = async (params: {
  readonly password: string;
  readonly hash: string;
  readonly salt: string;
}): Promise<boolean> => {
  const derived = new Uint8Array(
    await derivePassword({ password: params.password, salt: fromBase64(params.salt) }),
  );
  const expected = fromBase64(params.hash);
  return (
    derived.length === expected.length && derived.every((value, index) => value === expected[index])
  );
};
