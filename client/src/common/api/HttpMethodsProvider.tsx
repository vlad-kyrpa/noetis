import { createContext, useContext } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { HttpMethods } from './types';

interface HttpMethodsProviderProps {
  children: ReactNode;
  methods: HttpMethods;
}

const HttpMethodsContext = createContext<HttpMethods | null>(null);

// Makes an HTTP method map available to application hooks without concrete imports.
export function HttpMethodsProvider({ children, methods }: HttpMethodsProviderProps): ReactElement {
  return <HttpMethodsContext.Provider value={methods}>{children}</HttpMethodsContext.Provider>;
}

// Reads the configured HTTP method map and fails clearly when the provider is missing.
export function useHttpMethods(): HttpMethods {
  const methods = useContext(HttpMethodsContext);

  if (methods === null) {
    throw new Error('HttpMethodsProvider is required before using backend HTTP clients.');
  }

  return methods;
}
