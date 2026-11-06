interface JoinPathParams {
  baseUrl: string;
  path: string;
}

// Joins a base URL and a feature path without doubling or dropping the separating slash.
export const joinPath = ({ baseUrl, path }: JoinPathParams): string =>
  `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
