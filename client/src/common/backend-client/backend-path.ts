interface JoinPathParams {
  baseUrl: string;
  path: string;
}

const TRAILING_SLASHES = /\/+$/;
const LEADING_SLASHES = /^\/+/;

// Joins a base URL and a feature path without doubling or dropping the separating slash. An empty
// path yields the base itself, so a module's root endpoint never gains a trailing slash.
export const joinPath = ({ baseUrl, path }: JoinPathParams): string => {
  const base = baseUrl.replace(TRAILING_SLASHES, '');
  const segment = path.replace(LEADING_SLASHES, '');

  return segment === '' ? base : `${base}/${segment}`;
};
